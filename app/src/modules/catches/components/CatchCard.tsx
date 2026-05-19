import {
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
