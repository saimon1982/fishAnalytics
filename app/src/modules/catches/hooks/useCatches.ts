import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCatches,
  createCatch,
  updateCatch,
  deleteCatch,
  updateCatchWeather,
} from '../services/catchesService'
import { fetchWeather } from '@/modules/weather/services/weatherService'
import type { CatchFormData } from '@/types/domain'

export const CATCHES_KEY = 'catches'

export function useCatches(uid: string) {
  return useQuery({
    queryKey: [CATCHES_KEY, uid],
    queryFn: () => getCatches(uid),
    enabled: !!uid,
  })
}

export function useCreateCatch(uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ data, photoFiles }: { data: CatchFormData; photoFiles: File[] }) => {
      const weather = await fetchWeather(data.location.lat, data.location.lng, data.catchAt)
      return createCatch(uid, data, weather, photoFiles)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATCHES_KEY, uid] }),
  })
}

export function useUpdateCatch(uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      catchId,
      data,
      newPhotoFiles,
      existingPhotos,
      weatherOverrides,
    }: {
      catchId: string
      data: Partial<CatchFormData>
      newPhotoFiles?: File[]
      existingPhotos?: import('@/types/domain').PhotoRef[]
      weatherOverrides?: Partial<import('@/types/domain').WeatherSnapshot>
    }) => updateCatch(uid, catchId, data, newPhotoFiles, existingPhotos, weatherOverrides),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATCHES_KEY, uid] }),
  })
}

export function useDeleteCatch(uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (catchRecord: import('@/types/domain').CatchRecord) => deleteCatch(uid, catchRecord),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATCHES_KEY, uid] }),
  })
}

export function useRetryWeather(uid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (catchRecord: import('@/types/domain').CatchRecord) => {
      const weather = await fetchWeather(
        catchRecord.location.lat,
        catchRecord.location.lng,
        catchRecord.catchAt,
      )
      await updateCatchWeather(uid, catchRecord.id, weather)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATCHES_KEY, uid] }),
  })
}
