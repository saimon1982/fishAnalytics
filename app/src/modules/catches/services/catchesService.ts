import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import type { CatchRecord, CatchFormData, PhotoRef, WeatherSnapshot } from '@/types/domain'

const MAX_PHOTOS = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

function catchesRef(uid: string) {
  return collection(db, 'users', uid, 'catches')
}

function catchDocRef(uid: string, catchId: string) {
  return doc(db, 'users', uid, 'catches', catchId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firestoreDataToCatch(id: string, data: any): CatchRecord {
  return {
    id,
    species: data.species,
    sizeCm: data.sizeCm ?? null,
    weightKg: data.weightKg ?? null,
    location: data.location,
    catchAt: (data.catchAt as Timestamp).toDate(),
    bait: data.bait ?? null,
    gear: data.gear ?? null,
    technique: data.technique ?? null,
    depthM: data.depthM ?? null,
    waterTempC: data.waterTempC ?? null,
    waterType: data.waterType ?? null,
    photos: data.photos?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PhotoRef => ({
        ...p,
        uploadedAt: (p.uploadedAt as Timestamp).toDate(),
      }),
    ) ?? [],
    weather: {
      ...data.weather,
      fetchedAt: data.weather?.fetchedAt ? (data.weather.fetchedAt as Timestamp).toDate() : null,
    },
    metadata: {
      createdAt: (data.metadata?.createdAt as Timestamp).toDate(),
      updatedAt: (data.metadata?.updatedAt as Timestamp).toDate(),
      createdBy: data.metadata?.createdBy,
    },
  }
}

export async function getCatches(uid: string): Promise<CatchRecord[]> {
  const q = query(catchesRef(uid), orderBy('catchAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => firestoreDataToCatch(d.id, d.data()))
}

export async function getCatchesBySpecies(uid: string, species: string): Promise<CatchRecord[]> {
  const q = query(catchesRef(uid), where('species', '==', species), orderBy('catchAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => firestoreDataToCatch(d.id, d.data()))
}

export async function getIncompleteCatches(uid: string): Promise<CatchRecord[]> {
  const q = query(catchesRef(uid), where('weather.status', '==', 'incomplete'), orderBy('catchAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => firestoreDataToCatch(d.id, d.data()))
}

function validatePhotoFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('invalidFile')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('fileTooLarge')
  }
}

export async function uploadPhotos(uid: string, catchId: string, files: File[]): Promise<PhotoRef[]> {
  if (files.length > MAX_PHOTOS) throw new Error('tooManyPhotos')
  const refs: PhotoRef[] = []
  for (const file of files) {
    validatePhotoFile(file)
    const photoId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const storagePath = `users/${uid}/catches/${catchId}/${photoId}.${ext}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file, { contentType: file.type })
    const downloadURL = await getDownloadURL(storageRef)
    refs.push({
      storagePath,
      downloadURL,
      contentType: file.type,
      width: null,
      height: null,
      uploadedAt: new Date(),
    })
  }
  return refs
}

export async function deletePhoto(photo: PhotoRef): Promise<void> {
  const storageRef = ref(storage, photo.storagePath)
  await deleteObject(storageRef)
}

export async function createCatch(
  uid: string,
  data: CatchFormData,
  weather: WeatherSnapshot,
  photoFiles: File[],
): Promise<CatchRecord> {
  if (photoFiles.length > MAX_PHOTOS) throw new Error('tooManyPhotos')

  const docRef = await addDoc(catchesRef(uid), {
    species: data.species,
    sizeCm: data.sizeCm ?? null,
    weightKg: data.weightKg ?? null,
    location: data.location,
    catchAt: Timestamp.fromDate(data.catchAt),
    bait: data.bait ?? null,
    gear: data.gear ?? null,
    technique: data.technique ?? null,
    depthM: data.depthM ?? null,
    waterTempC: data.waterTempC ?? null,
    waterType: data.waterType ?? null,
    photos: [],
    weather,
    metadata: {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: uid,
    },
  })

  let photos: PhotoRef[] = []
  if (photoFiles.length > 0) {
    photos = await uploadPhotos(uid, docRef.id, photoFiles)
    await updateDoc(docRef, { photos })
  }

  const snap = await getDocs(query(catchesRef(uid), where('__name__', '==', docRef.id)))
  return firestoreDataToCatch(docRef.id, snap.docs[0].data())
}

export async function updateCatch(
  uid: string,
  catchId: string,
  data: Partial<CatchFormData>,
  newPhotoFiles?: File[],
  existingPhotos?: PhotoRef[],
): Promise<void> {
  const updates: Record<string, unknown> = {
    ...data,
    'metadata.updatedAt': serverTimestamp(),
  }
  if (data.catchAt) {
    updates['catchAt'] = Timestamp.fromDate(data.catchAt)
  }
  if (newPhotoFiles && newPhotoFiles.length > 0) {
    const existing = existingPhotos ?? []
    if (existing.length + newPhotoFiles.length > MAX_PHOTOS) throw new Error('tooManyPhotos')
    const newRefs = await uploadPhotos(uid, catchId, newPhotoFiles)
    updates['photos'] = [...existing, ...newRefs]
  }
  await updateDoc(catchDocRef(uid, catchId), updates)
}

export async function deleteCatch(uid: string, catchRecord: CatchRecord): Promise<void> {
  for (const photo of catchRecord.photos) {
    try {
      await deletePhoto(photo)
    } catch {
      // ignore individual photo deletion errors
    }
  }
  await deleteDoc(catchDocRef(uid, catchRecord.id))
}

export async function updateCatchWeather(uid: string, catchId: string, weather: WeatherSnapshot): Promise<void> {
  await updateDoc(catchDocRef(uid, catchId), {
    weather,
    'metadata.updatedAt': serverTimestamp(),
  })
}
