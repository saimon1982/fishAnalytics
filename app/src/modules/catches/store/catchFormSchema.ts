import { z } from 'zod'

const nullablePositiveNum = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().positive().nullable().optional(),
)

const nullableNum = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().nullable().optional(),
)

export const catchFormSchema = z.object({
  species: z.string().min(1, 'required'),
  sizeCm: nullablePositiveNum,
  weightKg: nullablePositiveNum,
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().nullable(),
  }),
  catchAt: z.date(),
  bait: z.string().nullable().optional(),
  gear: z.string().nullable().optional(),
  technique: z.string().nullable().optional(),
  depthM: nullablePositiveNum,
  waterTempC: nullableNum,
  waterType: z.enum(['fresh', 'salt', 'mixed']).nullable().optional(),
  moonPhase: z.string().nullable().optional(),
  windSpeedKmh: nullableNum,
})

export type CatchFormValues = z.infer<typeof catchFormSchema>
