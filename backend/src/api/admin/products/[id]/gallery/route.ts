import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
import { GALLERY_MODULE } from "../../../../../modules/gallery"
import type GalleryModuleService from "../../../../../modules/gallery/service"
import { GALLERY_CATEGORIES } from "../../../../../modules/gallery/models/gallery_image"

async function resolveHousePlanId(productId: string, query: any): Promise<string | null> {
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["house_plan.id"],
    filters: { id: productId },
  })
  return (products[0]?.house_plan as any)?.id ?? null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const housePlanId = await resolveHousePlanId(id, query)
  if (!housePlanId) {
    return res.status(404).json({ message: "Brak powiązanego planu domu" })
  }

  const images = await galleryService.listGalleryImages(
    { house_plan_id: housePlanId },
    { order: { sort_order: "ASC" } }
  )

  res.json({ gallery_images: images })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const housePlanId = await resolveHousePlanId(id, query)
  if (!housePlanId) {
    return res.status(404).json({ message: "Brak powiązanego planu domu" })
  }

  const { filename, content, mimeType, description, category, sort_order } =
    req.body as {
      filename: string
      content: string
      mimeType: string
      description?: string
      category?: string
      sort_order?: number
    }

  if (!filename || !content || !mimeType) {
    return res.status(400).json({ message: "Wymagane: filename, content, mimeType" })
  }

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)
  const galleryService = req.scope.resolve<GalleryModuleService>(GALLERY_MODULE)

  const uploaded = await fileService.createFiles({
    filename,
    mimeType,
    content,
    access: "public",
  })

  const url = (uploaded as any).url as string
  const safeCategory =
    category && (GALLERY_CATEGORIES as readonly string[]).includes(category)
      ? (category as typeof GALLERY_CATEGORIES[number])
      : "wizualizacje"

  const image = await galleryService.createGalleryImages({
    house_plan_id: housePlanId,
    url,
    description: description ?? null,
    category: safeCategory,
    sort_order: sort_order ?? 0,
  })

  res.status(201).json({ gallery_image: image })
}
