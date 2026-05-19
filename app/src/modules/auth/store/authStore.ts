import { create } from 'zustand'
import type { UserProfile } from '@/types/domain'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  authErrorCode: string | null
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setAuthErrorCode: (code: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  authErrorCode: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setAuthErrorCode: (authErrorCode) => set({ authErrorCode }),
}))
