import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../../../../../../modules/gallery"
import type GalleryModuleService from "../../../../../../../../modules/gallery/service"
import type { UpdateGalleryImageSchema } from "../validators"

export async function POST(
  req: MedusaRequest<UpdateGalleryImageSchema>,
  res: MedusaResponse
) {
  const { imageId } = req.params
  const { description, category, sort_order } = req.validatedBody

  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const existing = await galleryService.listGalleryImages({ id: imageId })
  if (!existing.length) {
    return res.status(404).json({ message: "Zdjęcie nie istnieje" })
  }

  const updated = await galleryService.updateGalleryImages({
    id: imageId,
    ...(description !== undefined ? { description } : {}),
    ...(category !== undefined ? { category } : {}),
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
