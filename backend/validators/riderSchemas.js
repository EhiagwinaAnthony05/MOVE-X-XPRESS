const { z } = require('zod')

const riderIdentitySchema = z.object({
  name: z.string().trim().min(2, 'name is required'),
  phone: z.string().trim().min(5, 'phone is required'),
})

const riderLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().optional(),
  capturedAt: z.string().datetime().optional(),
})

const sharingStateSchema = z.object({
  isSharing: z.boolean(),
})

module.exports = {
  riderIdentitySchema,
  riderLocationSchema,
  sharingStateSchema,
}
