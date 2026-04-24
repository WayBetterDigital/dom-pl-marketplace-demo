import { z } from "@medusajs/framework/zod"

export const VendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type VendorLoginSchema = z.infer<typeof VendorLoginSchema>
