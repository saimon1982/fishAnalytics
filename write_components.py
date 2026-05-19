#!/usr/bin/env python3
"""Write all MUI v9-compatible component files for Fish Analytics."""

import os

files = {}

# ------- CatchCard -------
files['src/modules/catches/components/CatchCard.tsx'] = r"""import {
  Card, CardContent, CardMedia, Typography, Stack, Chip, Box,
  IconButton, Menu, MenuItem, Tooltip,
} from '@mui/material'
import { MoreVert, LocationOn, WbSunny, Warning } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatchRecord } from '@/types/domain'
import { weatherCodeDescription } from '@/modules/weather/services/weatherService'

interface Props {
  catchRecord: CatchRecord
  onEdit: (c: CatchRecord) => void
  onDelete: (c: CatchRecord) => void
  onRetryWeather: (c: CatchRecord) => void
}

export function CatchCard({ catchRecord, onEdit, onDelete, onRetryWeather }: Props) {
  const { t } = useTranslation('catches')
  const { t: tc } = useTranslation('common')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const mainPhoto = catchRecord.photos[0]
  const weatherComplete = catchRecord.weather.status === 'complete'

  const dateStr = catchRecord.catchAt.toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {mainPhoto && (
        <CardMedia component="img" height={180} image={mainPhoto.downloadURL} alt={catchRecord.species}
          sx={{ objectFit: 'cover' }} />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{catchRecord.species}</Typography>
            <Typography variant="caption" color="text.secondary">{dateStr}</Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}><MoreVert /></IconButton>
        </Box>

        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleMenuClose}>
          <MenuItem onClick={() => { onEdit(catchRecord); handleMenuClose() }}>{tc('edit')}</MenuItem>
          {!weatherComplete && (
            <MenuItem onClick={() => { onRetryWeather(catchRecord); handleMenuClose() }}>{t('weatherRetry')}</MenuItem>
          )}
          <MenuItem onClick={() => { onDelete(catchRecord); handleMenuClose() }} sx={{ color: 'error.main' }}>
            {tc('delete')}
          </MenuItem>
        </Menu>

        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }} useFlexGap>
          {catchRecord.sizeCm && <Chip size="small" label={`${catchRecord.sizeCm} cm`} />}
          {catchRecord.weightKg && <Chip size="small" label={`${catchRecord.weightKg} kg`} />}
          {catchRecord.technique && <Chip size="small" label={catchRecord.technique} variant="outlined" />}
          {catchRecord.bait && <Chip size="small" label={catchRecord.bait} variant="outlined" color="secondary" />}
        </Stack>

        {catchRecord.location.label && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">{catchRecord.location.label}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          {weatherComplete ? (
            <>
              <WbSunny fontSize="small" color="warning" />
              <Typography variant="caption">
                {catchRecord.weather.weatherCode != null
                  ? weatherCodeDescription(catchRecord.weather.weatherCode)
                  : '—'}
              </Typography>
              {catchRecord.weather.windSpeedKmh != null && (
                <Typography variant="caption" color="text.secondary">
                  · {catchRecord.weather.windSpeedKmh} km/h · {catchRecord.weather.pressureHpa} hPa
                </Typography>
              )}
              {catchRecord.weather.moonPhase && (
                <Chip size="small" label={catchRecord.weather.moonPhase} sx={{ ml: 0.5 }} />
              )}
            </>
          ) : (
            <Tooltip title={t('weatherRetry')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Warning fontSize="small" color="warning" />
                <Typography variant="caption" color="text.secondary">{t('weatherIncomplete')}</Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
"""

# ------- CatchForm -------
files['src/modules/catches/components/CatchForm.tsx'] = r"""import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box, Button, CircularProgress, Grid2 as Grid, MenuItem, TextField,
  Typography, IconButton, Chip, Stack,
} from '@mui/material'
import { MyLocation, AddPhotoAlternate, Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { catchFormSchema, type CatchFormValues } from '../store/catchFormSchema'
import type { CatchRecord } from '@/types/domain'

interface Props {
  defaultValues?: Partial<CatchFormValues>
  catchRecord?: CatchRecord
  onSubmit: (data: CatchFormValues, photoFiles: File[]) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function CatchForm({ defaultValues, onSubmit, onCancel, loading }: Props) {
  const { t } = useTranslation('catches')
  const { t: tc } = useTranslation('common')
  const { t: te } = useTranslation('errors')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CatchFormValues>({
    resolver: zodResolver(catchFormSchema),
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
      ...defaultValues,
    },
  })

  const handleGeolocate = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('location.lat', pos.coords.latitude)
        setValue('location.lng', pos.coords.longitude)
        setGeoLoading(false)
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
          <TextField {...register('sizeCm')} label={t('size')} fullWidth type="number" inputProps={{ step: 0.1 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...register('weightKg')} label={t('weight')} fullWidth type="number" inputProps={{ step: 0.01 }} />
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
            inputProps={{ step: 0.000001 }}
            error={!!errors.location?.lat}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...register('location.lng', { valueAsNumber: true })}
            label={t('longitude')}
            required
            fullWidth
            type="number"
            inputProps={{ step: 0.000001 }}
            error={!!errors.location?.lng}
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
          <Chip label={t('weatherFetching')} color="info" size="small" variant="outlined" />
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
"""

# ------- CatchesPage -------
files['src/modules/catches/components/CatchesPage.tsx'] = r"""import { useState } from 'react'
import {
  Box, Button, Dialog, DialogContent, DialogTitle,
  Grid2 as Grid, Typography, Alert, Fab, CircularProgress,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useCatches, useCreateCatch, useUpdateCatch, useDeleteCatch, useRetryWeather } from '../hooks/useCatches'
import { CatchCard } from './CatchCard'
import { CatchForm } from './CatchForm'
import type { CatchRecord, CatchFormData } from '@/types/domain'
import type { CatchFormValues } from '../store/catchFormSchema'

interface Props {
  uid: string
}

export function CatchesPage({ uid }: Props) {
  const { t } = useTranslation('catches')
  const { t: tc } = useTranslation('common')
  const { data: catches, isLoading, error } = useCatches(uid)
  const createMutation = useCreateCatch(uid)
  const updateMutation = useUpdateCatch(uid)
  const deleteMutation = useDeleteCatch(uid)
  const retryWeatherMutation = useRetryWeather(uid)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CatchRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatchRecord | null>(null)

  const formDefaultValues = editTarget
    ? {
        species: editTarget.species,
        sizeCm: editTarget.sizeCm,
        weightKg: editTarget.weightKg,
        location: editTarget.location,
        catchAt: editTarget.catchAt,
        bait: editTarget.bait,
        gear: editTarget.gear,
        technique: editTarget.technique,
        depthM: editTarget.depthM,
        waterTempC: editTarget.waterTempC,
        waterType: editTarget.waterType,
      }
    : undefined

  const handleCreate = async (data: CatchFormValues, photoFiles: File[]) => {
    await createMutation.mutateAsync({ data: data as CatchFormData, photoFiles })
    setDialogOpen(false)
  }

  const handleUpdate = async (data: CatchFormValues, newPhotoFiles: File[]) => {
    if (!editTarget) return
    await updateMutation.mutateAsync({
      catchId: editTarget.id,
      data: data as Partial<CatchFormData>,
      newPhotoFiles,
      existingPhotos: editTarget.photos,
    })
    setEditTarget(null)
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget)
    setDeleteTarget(null)
  }

  const handleEdit = (c: CatchRecord) => { setEditTarget(c); setDialogOpen(true) }
  const handleOpenNew = () => { setEditTarget(null); setDialogOpen(true) }
  const handleCloseDialog = () => { setDialogOpen(false); setEditTarget(null) }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{tc('generic')}</Alert>

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>{t('title')}</Typography>

      {catches?.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">{t('noCatches')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('noCatchesHint')}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {catches?.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <CatchCard
              catchRecord={c}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onRetryWeather={(r) => retryWeatherMutation.mutate(r)}
            />
          </Grid>
        ))}
      </Grid>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={handleOpenNew}>
        <Add />
      </Fab>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? t('editCatch') : t('newCatch')}</DialogTitle>
        <DialogContent>
          <CatchForm
            defaultValues={formDefaultValues}
            catchRecord={editTarget ?? undefined}
            onSubmit={editTarget ? handleUpdate : handleCreate}
            onCancel={handleCloseDialog}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>{t('deleteCatch')}</DialogTitle>
        <DialogContent>
          <Typography>{t('deleteConfirm')}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={() => setDeleteTarget(null)}>{tc('cancel')}</Button>
            <Button
              variant="contained" color="error"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {tc('delete')}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
"""

# ------- SearchPage -------
files['src/modules/search/components/SearchPage.tsx'] = r"""import { useState, useMemo } from 'react'
import {
  Box, Button, TextField, InputAdornment, Stack, Chip,
  MenuItem, Typography, Grid2 as Grid, CircularProgress,
  Dialog, DialogContent, DialogTitle,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useCatches, useUpdateCatch, useDeleteCatch, useRetryWeather } from '@/modules/catches/hooks/useCatches'
import { CatchCard } from '@/modules/catches/components/CatchCard'
import { CatchForm } from '@/modules/catches/components/CatchForm'
import type { CatchRecord, CatchFormData } from '@/types/domain'
import type { CatchFormValues } from '@/modules/catches/store/catchFormSchema'

interface Props {
  uid: string
}

export function SearchPage({ uid }: Props) {
  const { t: tc } = useTranslation('common')
  const { t: tcat } = useTranslation('catches')
  const { data: catches, isLoading } = useCatches(uid)
  const updateMutation = useUpdateCatch(uid)
  const deleteMutation = useDeleteCatch(uid)
  const retryWeatherMutation = useRetryWeather(uid)

  const [searchText, setSearchText] = useState('')
  const [filterTechnique, setFilterTechnique] = useState('')
  const [filterBait, setFilterBait] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [editTarget, setEditTarget] = useState<CatchRecord | null>(null)

  const allTechniques = useMemo(
    () => [...new Set((catches ?? []).map((c) => c.technique).filter(Boolean))] as string[],
    [catches],
  )
  const allBaits = useMemo(
    () => [...new Set((catches ?? []).map((c) => c.bait).filter(Boolean))] as string[],
    [catches],
  )

  const filtered = useMemo(() => {
    return (catches ?? []).filter((c) => {
      if (searchText && !c.species.toLowerCase().includes(searchText.toLowerCase())) return false
      if (filterTechnique && c.technique !== filterTechnique) return false
      if (filterBait && c.bait !== filterBait) return false
      if (filterDateFrom && c.catchAt < new Date(filterDateFrom)) return false
      if (filterDateTo && c.catchAt > new Date(filterDateTo + 'T23:59:59')) return false
      return true
    })
  }, [catches, searchText, filterTechnique, filterBait, filterDateFrom, filterDateTo])

  const clearFilters = () => {
    setSearchText('')
    setFilterTechnique('')
    setFilterBait('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const activeFilters = [filterTechnique, filterBait, filterDateFrom, filterDateTo].filter(Boolean).length

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>{tc('search')}</Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={tcat('species')}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select value={filterTechnique} onChange={(e) => setFilterTechnique(e.target.value)}
            label={tcat('technique')} sx={{ minWidth: 160 }}
          >
            <MenuItem value=""><em>{tc('filter')}</em></MenuItem>
            {allTechniques.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField
            select value={filterBait} onChange={(e) => setFilterBait(e.target.value)}
            label={tcat('bait')} sx={{ minWidth: 160 }}
          >
            <MenuItem value=""><em>{tc('filter')}</em></MenuItem>
            {allBaits.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </TextField>
          <TextField
            type="date" label={tc('from')} value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date" label={tc('to')} value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {activeFilters > 0 && (
            <Chip label={`${tc('clear')} (${activeFilters})`} onDelete={clearFilters} />
          )}
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filtered.length} risultati
      </Typography>

      <Grid container spacing={3}>
        {filtered.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <CatchCard
              catchRecord={c}
              onEdit={setEditTarget}
              onDelete={(r) => deleteMutation.mutate(r)}
              onRetryWeather={(r) => retryWeatherMutation.mutate(r)}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{tcat('editCatch')}</DialogTitle>
        <DialogContent>
          {editTarget && (
            <CatchForm
              defaultValues={{ ...editTarget }}
              catchRecord={editTarget}
              onSubmit={async (data: CatchFormValues, newPhotoFiles: File[]) => {
                if (!editTarget) return
                await updateMutation.mutateAsync({
                  catchId: editTarget.id,
                  data: data as Partial<CatchFormData>,
                  newPhotoFiles,
                  existingPhotos: editTarget.photos,
                })
                setEditTarget(null)
              }}
              onCancel={() => setEditTarget(null)}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={clearFilters}>{tc('clear')}</Button>
      </Box>
    </Box>
  )
}
"""

# ------- DashboardPage -------
files['src/modules/dashboard/components/DashboardPage.tsx'] = r"""import { useMemo, useState } from 'react'
import {
  Box, Card, CardContent, CircularProgress, Grid2 as Grid,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useCatches } from '@/modules/catches/hooks/useCatches'

const COLORS = ['#1565C0', '#00897B', '#F57F17', '#AD1457', '#6A1B9A', '#1976D2', '#388E3C']

interface Props { uid: string }

type Period = 'day' | 'week' | 'month' | 'year'

function groupByPeriod(dates: Date[], period: Period): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of dates) {
    let key: string
    if (period === 'day') key = d.toISOString().slice(0, 10)
    else if (period === 'week') {
      const monday = new Date(d); monday.setDate(d.getDate() - d.getDay() + 1)
      key = monday.toISOString().slice(0, 10)
    } else if (period === 'month') key = d.toISOString().slice(0, 7)
    else key = String(d.getFullYear())
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function DashboardPage({ uid }: Props) {
  const { t } = useTranslation('dashboard')
  const { data: catches, isLoading } = useCatches(uid)
  const [period, setPeriod] = useState<Period>('month')

  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) counts[c.species] = (counts[c.species] ?? 0) + 1
    return Object.entries(counts).map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count)
  }, [catches])

  const trendData = useMemo(() => {
    const dates = (catches ?? []).map((c) => c.catchAt)
    const grouped = groupByPeriod(dates, period)
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  }, [catches, period])

  const baitData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) if (c.bait) counts[c.bait] = (counts[c.bait] ?? 0) + 1
    return Object.entries(counts).map(([bait, count]) => ({ bait, count })).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [catches])

  const techniqueData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) if (c.technique) counts[c.technique] = (counts[c.technique] ?? 0) + 1
    return Object.entries(counts).map(([technique, count]) => ({ technique, count })).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [catches])

  const moonCorrelation = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) {
      if (c.weather.moonPhase) counts[c.weather.moonPhase] = (counts[c.weather.moonPhase] ?? 0) + 1
    }
    return Object.entries(counts).map(([phase, count]) => ({ phase, count })).sort((a, b) => b.count - a.count)
  }, [catches])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  const total = catches?.length ?? 0

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>{t('title')}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{t('subtitle')}</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 700 }}>{total}</Typography>
              <Typography variant="body1">{t('totalCatches')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color="secondary" sx={{ fontWeight: 700 }}>{speciesData.length}</Typography>
              <Typography variant="body1">Specie</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color="warning.main" sx={{ fontWeight: 700 }}>
                {catches?.filter((c) => c.weather.status === 'incomplete').length ?? 0}
              </Typography>
              <Typography variant="body1">{t('incomplete')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('bySpecies')}</Typography>
              {speciesData.length === 0
                ? <Typography color="text.secondary">{t('noDataForPeriod')}</Typography>
                : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={speciesData} dataKey="count" nameKey="species" cx="50%" cy="50%" outerRadius={100} label>
                        {speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">{t('trendOverTime')}</Typography>
                <TextField select value={period} onChange={(e) => setPeriod(e.target.value as Period)} size="small" sx={{ minWidth: 120 }}>
                  <MenuItem value="day">{t('periodDay')}</MenuItem>
                  <MenuItem value="week">{t('periodWeek')}</MenuItem>
                  <MenuItem value="month">{t('periodMonth')}</MenuItem>
                  <MenuItem value="year">{t('periodYear')}</MenuItem>
                </TextField>
              </Box>
              {trendData.length === 0
                ? <Typography color="text.secondary">{t('noDataForPeriod')}</Typography>
                : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1565C0" strokeWidth={2} dot={false} name={t('catches')} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('topBaits')}</Typography>
              {baitData.length === 0
                ? <Typography color="text.secondary">{t('noDataForPeriod')}</Typography>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={baitData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="bait" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00897B" name={t('catches')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('weatherCorrelation')}</Typography>
              {moonCorrelation.length === 0
                ? <Typography color="text.secondary">{t('noDataForPeriod')}</Typography>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={moonCorrelation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name={t('catches')}>
                        {moonCorrelation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('topTechniques')}</Typography>
              {techniqueData.length === 0
                ? <Typography color="text.secondary">{t('noDataForPeriod')}</Typography>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={techniqueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="technique" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1565C0" name={t('catches')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
"""

# ------- AppLayout -------
files['src/modules/shared/components/AppLayout.tsx'] = r"""import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, BottomNavigation,
  BottomNavigationAction, Toolbar, Typography, useMediaQuery, useTheme, Divider,
} from '@mui/material'
import { Dashboard, Search, Menu as MenuIcon, Settings } from '@mui/icons-material'
import SetMeal from '@mui/icons-material/SetMeal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/modules/auth/hooks/useAuth'

const DRAWER_WIDTH = 240

const navItems = [
  { path: '/dashboard', icon: <Dashboard />, key: 'dashboard' },
  { path: '/catches', icon: <SetMeal />, key: 'catches' },
  { path: '/search', icon: <Search />, key: 'search' },
  { path: '/settings', icon: <Settings />, key: 'settings' },
]

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { t: tc } = useTranslation('common')
  const { t: td } = useTranslation('dashboard')
  const { t: tcat } = useTranslation('catches')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)

  const getLabel = (key: string) => {
    if (key === 'dashboard') return td('title')
    if (key === 'catches') return tcat('title')
    if (key === 'search') return tc('search')
    return tc('settings')
  }

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>🎣 Fish Analytics</Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => { navigate(item.path); setMobileOpen(false) }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={getLabel(item.key)} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  const activeIndex = navItems.findIndex((n) => location.pathname.startsWith(n.path))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {!isMobile && '🎣 '}Fish Analytics
          </Typography>
          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar src={user?.photoURL ?? undefined} sx={{ width: 32, height: 32 }}>
              {user?.displayName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)}>
            <MenuItem disabled><Typography variant="body2">{user?.displayName}</Typography></MenuItem>
            <MenuItem disabled><Typography variant="caption">{user?.email}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null) }}>{tc('settings')}</MenuItem>
            <MenuItem onClick={() => { logout(); setProfileAnchor(null) }}>{tc('logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawerContent}
        </Drawer>
      )}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { sm: `${DRAWER_WIDTH}px` },
          mt: '64px',
          mb: isMobile ? '56px' : 0,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>

      {isMobile && (
        <BottomNavigation
          value={activeIndex}
          onChange={(_, v) => navigate(navItems[v].path)}
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: '1px solid #e0e0e0' }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.path} label={getLabel(item.key)} icon={item.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}
"""

base = '/home/saimon/workspaces/android/fishAnalytics/app'
for rel_path, content in files.items():
    full_path = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f'Written: {rel_path}')

print('All files written successfully.')
