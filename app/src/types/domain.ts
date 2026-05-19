// Domain types for Fish Analytics

export type WaterType = 'fresh' | 'salt' | 'mixed'
export type WeatherStatus = 'complete' | 'incomplete' | 'failed'

export interface Location {
  lat: number
  lng: number
  label: string | null
}

export interface PhotoRef {
  storagePath: string
  downloadURL: string
  contentType: string
  width: number | null
  height: number | null
  uploadedAt: Date
}

export interface WeatherSnapshot {
  status: WeatherStatus
  source: 'open-meteo' | null
  weatherCode: number | null
  windSpeedKmh: number | null
  pressureHpa: number | null
  moonPhase: string | null
  fetchedAt: Date | null
}

export interface CatchRecord {
  id: string
  species: string
  sizeCm: number | null
  weightKg: number | null
  location: Location
  catchAt: Date
  bait: string | null
  gear: string | null
  technique: string | null
  depthM: number | null
  waterTempC: number | null
  waterType: WaterType | null
  photos: PhotoRef[]
  weather: WeatherSnapshot
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
  }
}

export type CatchFormData = Omit<CatchRecord, 'id' | 'weather' | 'metadata' | 'photos'> & {
  photoFiles?: File[]
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  language: 'it' | 'en'
  createdAt: Date
  updatedAt: Date
}

export interface SharePermission {
  id: string
  targetEmail: string
  role: 'viewer'
  enabled: boolean
  createdAt: Date
}

export type AppLanguage = 'it' | 'en'
