import { z } from "@medusajs/framework/zod"

export const CreateVendorHousePlanSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  house_area: z.number().positive(),
  boiler_room_area: z.number().positive().optional(),
  rooms: z.number().int().positive(),
  bathrooms_and_wc: z.number().int().positive(),
  plot_dimensions: z.string().min(1),
  min_plot_dimensions_after_adaptation: z.string().optional(),
  floors: z.number().int().positive().optional(),
  building_width: z.number().positive().optional(),
  building_length: z.number().positive().optional(),
  building_footprint: z.number().positive().optional(),
  total_area: z.number().positive().optional(),
  roof_type: z.string().optional(),
  roof_angle: z.number().positive().optional(),
  garage: z.string().optional(),
  architectural_style: z.string().optional(),
  energy_standard: z.string().optional(),
  basement: z.string().optional(),
  building_height: z.number().positive().optional(),
  fireplace: z.boolean().optional(),
  terrace: z.boolean().optional(),
  house_type: z.string().optional(),
  family_id: z.string().optional(),
})

export type CreateVendorHousePlanSchema = z.infer<typeof CreateVendorHousePlanSchema>
