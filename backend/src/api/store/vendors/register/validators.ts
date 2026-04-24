import { z } from "@medusajs/framework/zod"

export const VendorRegisterSchema = z.object({
  company_name: z.string().min(2),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export type VendorRegisterSchema = z.infer<typeof VendorRegisterSchema>
