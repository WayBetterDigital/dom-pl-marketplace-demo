import { z } from "@medusajs/framework/zod"
import { GALLERY_CATEGORIES } from "../../../../../../../modules/gallery/models/gallery_image"

export const CreateGalleryImageSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
  mimeType: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(GALLERY_CATEGORIES).optional(),
  sort_order: z.number().int().optional(),
})

export type CreateGalleryImageSchema = z.infer<typeof CreateGalleryImageSchema>

export const UpdateGalleryImageSchema = z.object({
  description: z.string().optional(),
  category: z.enum(GALLERY_CATEGORIES).optional(),
  sort_order: z.number().int().optional(),
})

export type UpdateGalleryImageSchema = z.infer<typeof UpdateGalleryImageSchema>
