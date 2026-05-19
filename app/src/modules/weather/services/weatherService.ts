import type { WeatherSnapshot } from '@/types/domain'

interface OpenMeteoResponse {
  current: {
    weather_code: number
    wind_speed_10m: number
    surface_pressure: number
  }
  daily?: {
    time: string[]
  }
}

const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
]

/**
 * Compute moon phase label from a date using synodic month approximation.
 * This avoids any paid API.
 */
function computeMoonPhase(date: Date): string {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z')
  const synodicMonth = 29.530588853
  const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  const normalized = ((diff % synodicMonth) + synodicMonth) % synodicMonth
  const index = Math.floor((normalized / synodicMonth) * 8) % 8
  return MOON_PHASES[index]
}

export async function fetchWeather(lat: number, lng: number, catchAt: Date): Promise<WeatherSnapshot> {
  try {
    const dateStr = catchAt.toISOString().split('T')[0]
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=weather_code,wind_speed_10m,surface_pressure` +
      `&start_date=${dateStr}&end_date=${dateStr}` +
      `&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`)

    const data: OpenMeteoResponse = await response.json()
    const moonPhase = computeMoonPhase(catchAt)

    return {
      status: 'complete',
      source: 'open-meteo',
      weatherCode: data.current.weather_code,
      windSpeedKmh: data.current.wind_speed_10m,
      pressureHpa: data.current.surface_pressure,
      moonPhase,
      fetchedAt: new Date(),
    }
  } catch {
    return {
      status: 'incomplete',
      source: null,
      weatherCode: null,
      windSpeedKmh: null,
      pressureHpa: null,
      moonPhase: null,
      fetchedAt: null,
    }
  }
}

/** Map WMO weather code to human-readable description */
export function weatherCodeDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm heavy hail',
  }
  return descriptions[code] ?? `Code ${code}`
}
