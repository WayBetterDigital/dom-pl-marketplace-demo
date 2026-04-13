import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
import { GALLERY_MODULE } from "../../../../../../../modules/gallery"
import type GalleryModuleService from "../../../../../../../modules/gallery/service"
import type { CreateGalleryImageSchema } from "./validators"

export async function POST(
  req: MedusaRequest<CreateGalleryImageSchema>,
  res: MedusaResponse
) {
  const { planId } = req.params
  const { filename, content, mimeType, description, category, sort_order } =
    req.validatedBody

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)
  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const uploaded = await fileService.createFiles({
    filename,
    mimeType,
    content,
    access: "public",
  })

  const url = (uploaded as any).url as string

  const image = await galleryService.createGalleryImages({
    house_plan_id: planId,
    url,
    description: description ?? null,
    category: category ?? "wizualizacje",
    sort_order: sort_order ?? 0,
  })

  res.status(201).json({ gallery_image: image })
}
