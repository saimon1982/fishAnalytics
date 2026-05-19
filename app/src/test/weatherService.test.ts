import { describe, it, expect } from 'vitest'
import { weatherCodeDescription } from '@/modules/weather/services/weatherService'

describe('weatherCodeDescription', () => {
  it('returns Clear sky for code 0', () => {
    expect(weatherCodeDescription(0)).toBe('Clear sky')
  })

  it('returns Thunderstorm for code 95', () => {
    expect(weatherCodeDescription(95)).toBe('Thunderstorm')
  })

  it('returns fallback for unknown code', () => {
    expect(weatherCodeDescription(999)).toBe('Code 999')
  })
})
