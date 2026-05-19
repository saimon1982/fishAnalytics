import { useState, useMemo } from 'react'
import {
  Box, Button, TextField, InputAdornment, Stack, Chip,
  MenuItem, Typography, Grid, CircularProgress,
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
