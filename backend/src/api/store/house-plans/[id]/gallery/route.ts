import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../../../modules/gallery"
import type GalleryModuleService from "../../../../../modules/gallery/service"
import { GALLERY_CATEGORIES } from "../../../../../modules/gallery/models/gallery_image"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { category } = req.query as { category?: string }

  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const filters: Record<string, any> = { house_plan_id: id }

  if (category && category !== "wszystkie" && (GALLERY_CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category
  }

  const images = await galleryService.listGalleryImages(filters, {
    order: { sort_order: "ASC" },
  })

  res.json({ gallery_images: images })
}
