import { z } from 'zod'

export const catchFormSchema = z.object({
  species: z.string().min(1, 'required'),
  sizeCm: z.coerce.number().positive().nullable().optional().transform(v => v ?? null),
  weightKg: z.coerce.number().positive().nullable().optional().transform(v => v ?? null),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().nullable(),
  }),
  catchAt: z.date(),
  bait: z.string().nullable().optional(),
  gear: z.string().nullable().optional(),
  technique: z.string().nullable().optional(),
  depthM: z.coerce.number().positive().nullable().optional().transform(v => v ?? null),
  waterTempC: z.coerce.number().nullable().optional().transform(v => v ?? null),
  waterType: z.enum(['fresh', 'salt', 'mixed']).nullable().optional(),
})

export type CatchFormValues = z.infer<typeof catchFormSchema>
