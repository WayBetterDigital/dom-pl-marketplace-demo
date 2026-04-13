import { model } from "@medusajs/framework/utils"

export const GALLERY_CATEGORIES = [
  "wizualizacje",
  "strefa_dzienna",
  "kuchnia",
  "lazienka",
] as const

export type GalleryCategory = typeof GALLERY_CATEGORIES[number]

const GalleryImage = model.define("gallery_image", {
  id: model.id().primaryKey(),
  house_plan_id: model.text(),
  url: model.text(),
  description: model.text().nullable(),
  category: model.text().default("wizualizacje"),
  sort_order: model.number().default(0),
})

export default GalleryImage
