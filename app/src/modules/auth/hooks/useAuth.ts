import { useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import { useAuthStore } from '../store/authStore'
import type { UserProfile } from '@/types/domain'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })
export const AUTH_ERROR_STORAGE_KEY = 'fish-analytics-auth-error'
let authStateUnsubscribe: (() => void) | null = null
let authStateSubscribers = 0
let loginPopupPromise: Promise<void> | null = null

function persistAuthError(code: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_ERROR_STORAGE_KEY, code)
  }
}

function clearPersistedAuthError() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
  }
}

/** Thrown when the Google account is not present in the /whitelist collection. */
export class UserNotWhitelistedError extends Error {
  readonly code = 'auth/user-not-whitelisted'
  constructor(email: string) {
    super(`Account ${email} non autorizzato.`)
    this.name = 'UserNotWhitelistedError'
  }
}

function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function checkWhitelist(email: string): Promise<void> {
  const normalizedEmail = normalizeWhitelistEmail(email)
  const normalizedSnap = await getDoc(doc(db, 'whitelist', normalizedEmail))
  if (normalizedSnap.exists()) {
    return
  }

  if (normalizedEmail !== email) {
    const legacySnap = await getDoc(doc(db, 'whitelist', email))
    if (legacySnap.exists()) {
      return
    }
  }

  throw new UserNotWhitelistedError(email)
}

async function loadOrCreateUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    const newProfile: Omit<UserProfile, 'uid'> = {
      displayName: firebaseUser.displayName ?? '',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL,
      language: 'it',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { uid: firebaseUser.uid, ...newProfile }
  }
  const data = snap.data()
  return {
    uid: firebaseUser.uid,
    displayName: data.displayName as string,
    email: data.email as string,
    photoURL: data.photoURL as string | null,
    language: (data.language ?? 'it') as UserProfile['language'],
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  }
}

function ensureAuthStateListener() {
  if (authStateUnsubscribe) {
    return
  }

  authStateUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    const { setUser, setLoading, setAuthErrorCode } = useAuthStore.getState()

    try {
      if (firebaseUser) {
        const email = firebaseUser.email ?? ''
        await checkWhitelist(email)
        clearPersistedAuthError()
        setAuthErrorCode(null)

        const profile = await loadOrCreateUserProfile(firebaseUser)
        setUser(profile)
      } else {
        setUser(null)
      }
    } catch (error) {
      const code = (error as { code?: string })?.code ?? 'unknown'
      if (code === 'auth/user-not-whitelisted') {
        setAuthErrorCode(code)
        persistAuthError(code)
        setUser(null)
        await signOut(auth)
      } else if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
          photoURL: firebaseUser.photoURL,
          language: 'it',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  })
}

export function useAuth() {
  const { user, loading, authErrorCode, setUser, setLoading, setAuthErrorCode } = useAuthStore()

  useEffect(() => {
    authStateSubscribers += 1
    ensureAuthStateListener()

    return () => {
      authStateSubscribers -= 1
      if (authStateSubscribers === 0 && authStateUnsubscribe) {
        authStateUnsubscribe()
        authStateUnsubscribe = null
      }
    }
  }, [setAuthErrorCode, setUser, setLoading])

  const loginWithGoogle = async (): Promise<void> => {
    if (loginPopupPromise) {
      return loginPopupPromise
    }

    loginPopupPromise = (async () => {
      let credential
      try {
        credential = await signInWithPopup(auth, provider)
      } catch (popupError: unknown) {
        const code = (popupError as { code?: string })?.code
        if (code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider)
          return
        }
        if (code) {
          setAuthErrorCode(code)
        }
        throw popupError
      }

      const email = credential.user.email ?? ''
      try {
        await checkWhitelist(email)
      } catch (wlError) {
        const code = (wlError as { code?: string })?.code ?? 'auth/user-not-whitelisted'
        setAuthErrorCode(code)
        persistAuthError(code)
        await signOut(auth)
        throw wlError
      }

      clearPersistedAuthError()
      setAuthErrorCode(null)
    })().finally(() => {
      loginPopupPromise = null
    })

    return loginPopupPromise
  }

  const logout = async () => {
    await signOut(auth)
  }

  return { user, loading, authErrorCode, loginWithGoogle, logout, setAuthErrorCode }
}
