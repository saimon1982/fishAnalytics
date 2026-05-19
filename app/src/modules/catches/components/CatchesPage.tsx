import { useState } from 'react'
import {
  Box, Button, Dialog, DialogContent, DialogTitle,
  Grid, Typography, Alert, Fab, CircularProgress,
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
