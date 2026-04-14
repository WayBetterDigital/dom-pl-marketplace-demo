import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../../../../modules/gallery"
import type GalleryModuleService from "../../../../../../modules/gallery/service"
import { GALLERY_CATEGORIES } from "../../../../../../modules/gallery/models/gallery_image"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { imageId } = req.params
  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const existing = await galleryService.listGalleryImages({ id: imageId })
  if (!existing.length) {
    return res.status(404).json({ message: "Zdjęcie nie istnieje" })
  }

  const { description, category, sort_order } = req.body as {
    description?: string | null
    category?: string
    sort_order?: number
  }

  const safeCategory =
    category && (GALLERY_CATEGORIES as readonly string[]).includes(category)
      ? (category as typeof GALLERY_CATEGORIES[number])
      : undefined

  const updated = await galleryService.updateGalleryImages({
    id: imageId,
    ...(description !== undefined ? { description } : {}),
    ...(safeCategory !== undefined ? { category: safeCategory } : {}),
    ...(sort_order !== undefined ? { sort_order } : {}),
  })

  res.json({ gallery_image: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { imageId } = req.params
  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const existing = await galleryService.listGalleryImages({ id: imageId })
  if (!existing.length) {
    return res.status(404).json({ message: "Zdjęcie nie istnieje" })
  }

  await galleryService.deleteGalleryImages(imageId)
  res.json({ deleted: true })
}
