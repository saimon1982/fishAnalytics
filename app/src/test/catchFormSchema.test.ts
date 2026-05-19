import { describe, it, expect } from 'vitest'
import { catchFormSchema } from '@/modules/catches/store/catchFormSchema'

describe('catchFormSchema', () => {
  const validBase = {
    species: 'Trota',
    sizeCm: null,
    weightKg: null,
    location: { lat: 45.0, lng: 9.0, label: null },
    catchAt: new Date(),
    bait: null,
    gear: null,
    technique: null,
    depthM: null,
    waterTempC: null,
    waterType: null,
  }

  it('validates a correct catch record', () => {
    const result = catchFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('rejects empty species', () => {
    const result = catchFormSchema.safeParse({ ...validBase, species: '' })
    expect(result.success).toBe(false)
  })

  it('rejects lat out of range', () => {
    const result = catchFormSchema.safeParse({ ...validBase, location: { lat: 100, lng: 0, label: null } })
    expect(result.success).toBe(false)
  })

  it('rejects lng out of range', () => {
    const result = catchFormSchema.safeParse({ ...validBase, location: { lat: 45, lng: 200, label: null } })
    expect(result.success).toBe(false)
  })

  it('accepts optional numeric fields as null', () => {
    const result = catchFormSchema.safeParse({ ...validBase, sizeCm: null, weightKg: null })
    expect(result.success).toBe(true)
  })
})
