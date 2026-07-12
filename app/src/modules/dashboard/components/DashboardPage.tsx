import { useMemo, useState } from 'react'
import {
  Box, Card, CardContent, CircularProgress, Grid,
  MenuItem, TextField, Typography,
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useCatches } from '@/modules/catches/hooks/useCatches'

const COLORS = ['#1565C0', '#00897B', '#F57F17', '#AD1457', '#6A1B9A', '#1976D2', '#388E3C']

interface Props { readonly uid: string }

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
  const [selectedSpecies, setSelectedSpecies] = useState('all')

  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) counts[c.species] = (counts[c.species] ?? 0) + 1
    return Object.entries(counts)
      .map(([species, count], index) => ({ species, count, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.count - a.count)
  }, [catches])

  const trendData = useMemo(() => {
    const dates = (catches ?? []).map((c) => c.catchAt)
    const grouped = groupByPeriod(dates, period)
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  }, [catches, period])

  const baitData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) {
      if (selectedSpecies !== 'all' && c.species !== selectedSpecies) continue
      if (c.bait) counts[c.bait] = (counts[c.bait] ?? 0) + 1
    }
    return Object.entries(counts).map(([bait, count]) => ({ bait, count })).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [catches, selectedSpecies])

  const techniqueData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) {
      if (selectedSpecies !== 'all' && c.species !== selectedSpecies) continue
      if (c.technique) counts[c.technique] = (counts[c.technique] ?? 0) + 1
    }
    return Object.entries(counts).map(([technique, count]) => ({ technique, count })).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [catches, selectedSpecies])

  const availableSpecies = useMemo(() => {
    return [...new Set((catches ?? []).map((catchItem) => catchItem.species))].sort((a, b) => a.localeCompare(b))
  }, [catches])

  const moonCorrelation = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of catches ?? []) {
      if (c.weather.moonPhase) counts[c.weather.moonPhase] = (counts[c.weather.moonPhase] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([phase, count], index) => ({ phase, count, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.count - a.count)
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
                      <Pie data={speciesData} dataKey="count" nameKey="species" cx="50%" cy="50%" outerRadius={100} label />
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

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TextField
              select
              label={t('speciesFilter')}
              value={selectedSpecies}
              onChange={(event) => setSelectedSpecies(event.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            >
              <MenuItem value="all">{t('allSpecies')}</MenuItem>
              {availableSpecies.map((species) => (
                <MenuItem key={species} value={species}>{species}</MenuItem>
              ))}
            </TextField>
          </Box>
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
                      <Bar dataKey="count" name={t('catches')} />
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
