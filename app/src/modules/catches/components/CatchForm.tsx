import { useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box, Button, CircularProgress, Grid, MenuItem, TextField,
  Typography, IconButton, Chip, Stack,
} from '@mui/material'
import { MyLocation, AddPhotoAlternate, Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { catchFormSchema, type CatchFormValues } from '../store/catchFormSchema'
import type { CatchRecord, WeatherSnapshot } from '@/types/domain'
import { fetchWeather } from '@/modules/weather/services/weatherService'

interface Props {
  defaultValues?: Partial<CatchFormValues>
  catchRecord?: CatchRecord
  onSubmit: (data: CatchFormValues, photoFiles: File[]) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function CatchForm({ defaultValues, catchRecord, onSubmit, onCancel, loading }: Props) {
  const { t } = useTranslation('catches')
  const { t: tc } = useTranslation('common')
  const { t: te } = useTranslation('errors')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(catchRecord?.weather ?? null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm<CatchFormValues>({
    resolver: zodResolver(catchFormSchema) as Resolver<CatchFormValues>,
    defaultValues: {
      species: '',
      sizeCm: null,
      weightKg: null,
      location: { lat: 0, lng: 0, label: null },
      catchAt: new Date(),
      bait: null,
      gear: null,
      technique: null,
      depthM: null,
      waterTempC: null,
      waterType: null,
      moonPhase: null,
      windSpeedKmh: null,
      ...defaultValues,
    },
  })

  const handleGeolocate = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setValue('location.lat', lat)
        setValue('location.lng', lng)
        setGeoLoading(false)
        setWeatherLoading(true)
        const catchAt = getValues('catchAt')
        const snapshot = await fetchWeather(lat, lng, catchAt)
        setWeather(snapshot)
        setWeatherLoading(false)
      },
      () => setGeoLoading(false),
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const files = Array.from(e.target.files ?? [])
    const combined = [...photoFiles, ...files]
    if (combined.length > 3) { setPhotoError(te('tooManyPhotos')); return }
    for (const f of files) {
      if (!['image/jpeg', 'image/png'].includes(f.type)) { setPhotoError(te('invalidFile')); return }
      if (f.size > 5 * 1024 * 1024) { setPhotoError(te('fileTooLarge')); return }
    }
    setPhotoFiles(combined)
    setPhotoPreviews([...photoPreviews, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index))
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: CatchFormValues) => {
    await onSubmit(data, photoFiles)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            {...register('species')}
            label={t('species')}
            required
            fullWidth
            error={!!errors.species}
            helperText={errors.species ? tc('required') : undefined}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('sizeCm')}
            label={t('size')}
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: 0.1 } }}
            error={!!errors.sizeCm}
            helperText={errors.sizeCm ? tc('invalid') : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('weightKg')}
            label={t('weight')}
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: 0.01 } }}
            error={!!errors.weightKg}
            helperText={errors.weightKg ? tc('invalid') : undefined}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="catchAt"
            control={control}
            render={({ field }) => (
              <TextField
                label={t('catchAt')}
                type="datetime-local"
                required
                fullWidth
                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                error={!!errors.catchAt}
                helperText={errors.catchAt ? tc('required') : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...register('location.lat', { valueAsNumber: true })}
            label={t('latitude')}
            required
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: 0.000001 } }}
            error={!!errors.location?.lat}
            helperText={errors.location?.lat ? tc('required') : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...register('location.lng', { valueAsNumber: true })}
            label={t('longitude')}
            required
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: 0.000001 } }}
            error={!!errors.location?.lng}
            helperText={errors.location?.lng ? tc('required') : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleGeolocate}
            disabled={geoLoading}
            startIcon={geoLoading ? <CircularProgress size={16} /> : <MyLocation />}
            fullWidth
          >
            GPS
          </Button>
        </Grid>
        <Grid size={12}>
          <TextField {...register('location.label')} label={t('location')} fullWidth placeholder="Es. Lago di Como" />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...register('bait')} label={t('bait')} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...register('gear')} label={t('gear')} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...register('technique')} label={t('technique')} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="waterType"
            control={control}
            render={({ field }) => (
              <TextField select label={t('waterType')} fullWidth {...field} value={field.value ?? ''}>
                <MenuItem value=""><em>{tc('optional')}</em></MenuItem>
                <MenuItem value="fresh">{t('waterTypeFresh')}</MenuItem>
                <MenuItem value="salt">{t('waterTypeSalt')}</MenuItem>
                <MenuItem value="mixed">{t('waterTypeMixed')}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField {...register('depthM')} label={t('depth')} fullWidth type="number" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField {...register('waterTempC')} label={t('waterTemp')} fullWidth type="number" />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" gutterBottom>{t('photos')}</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            {photoPreviews.map((src, i) => (
              <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                <Box
                  component="img"
                  src={src}
                  sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #ddd' }}
                />
                <IconButton
                  size="small"
                  onClick={() => removePhoto(i)}
                  sx={{ position: 'absolute', top: -8, right: -8, background: 'white', border: '1px solid #ccc' }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {photoFiles.length < 3 && (
              <Button component="label" variant="outlined" startIcon={<AddPhotoAlternate />} sx={{ height: 80 }}>
                {t('addPhoto')}
                <input type="file" hidden accept="image/jpeg,image/png" multiple onChange={handlePhotoChange} />
              </Button>
            )}
          </Stack>
          {photoError && <Typography variant="caption" color="error">{photoError}</Typography>}
          <Typography variant="caption" color="text.secondary">{t('maxPhotos', { count: 3 })}</Typography>
        </Grid>

        <Grid size={12}>
          {weatherLoading && (
            <Chip label={t('weatherFetching')} color="info" size="small" variant="outlined" icon={<CircularProgress size={12} />} />
          )}
          {!weatherLoading && weather?.status === 'complete' && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
              {weather.moonPhase && <Chip label={weather.moonPhase} color="info" size="small" variant="outlined" />}
              {weather.windSpeedKmh != null && <Chip label={`${t('windSpeed')}: ${weather.windSpeedKmh} km/h`} color="info" size="small" variant="outlined" />}
              {weather.pressureHpa != null && <Chip label={`${t('pressure')}: ${weather.pressureHpa} hPa`} color="info" size="small" variant="outlined" />}
            </Stack>
          )}
          {!weatherLoading && weather?.status === 'incomplete' && (
            <Chip label={t('weatherIncomplete')} color="warning" size="small" variant="outlined" />
          )}
          {catchRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('moonPhase')}
                  label={t('moonPhase')}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('windSpeedKmh')}
                  label={t('windSpeed')}
                  fullWidth
                  type="number"
                  slotProps={{ htmlInput: { step: 0.1 } }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} disabled={loading}>{tc('cancel')}</Button>
        <Button type="submit" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}>
          {t('saveCatch')}
        </Button>
      </Box>
    </Box>
  )
}
