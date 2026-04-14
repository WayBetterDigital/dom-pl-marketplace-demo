import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IFileModuleService, IProductModuleService } from "@medusajs/framework/types"

type FileInput = {
  filename: string
  content: string
  mimeType: string
}

async function resolveProduct(planId: string, query: any) {
  const { data: housePlans } = await query.graph({
    entity: "house_plan",
    fields: [
      "id",
      "product.id",
      "product.thumbnail",
      "product.images.id",
      "product.images.url",
    ],
    filters: { id: planId },
  })
  return (housePlans[0]?.product as any) ?? null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { planId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const files = (req.body as { files: FileInput[] }).files
  if (!files?.length) {
    return res.status(400).json({ message: "Brak plików do przesłania" })
  }

  const product = await resolveProduct(planId, query)
  if (!product?.id) {
    return res.status(404).json({ message: "Nie znaleziono powiązanego produktu" })
  }

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  const uploaded = await Promise.all(
    files.map((f) =>
      fileService.createFiles({
        filename: f.filename,
        mimeType: f.mimeType,
        content: f.content,
        access: "public",
      })
    )
  )

  const newUrls = (uploaded as any[]).map((f) => ({ url: f.url as string }))
  const existingImages: Array<{ url: string }> = (
    (product.images as Array<{ url: string }>) ?? []
  ).map((img) => ({ url: img.url }))

  const existingThumbnail: string | null = product.thumbnail ?? null
  const allImages = [...existingImages, ...newUrls]
  const newThumbnail =
    !existingThumbnail && newUrls.length > 0 ? newUrls[0].url : existingThumbnail

  await productService.updateProducts(product.id, {
    images: allImages,
    ...(newThumbnail !== existingThumbnail ? { thumbnail: newThumbnail ?? undefined } : {}),
  })

  res.json({ images: allImages, thumbnail: newThumbnail })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { planId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const imageUrl = (req.body as { url: string }).url
  if (!imageUrl) {
    return res.status(400).json({ message: "Brak URL zdjęcia do usunięcia" })
  }

  const product = await resolveProduct(planId, query)
  if (!product?.id) {
    return res.status(404).json({ message: "Nie znaleziono powiązanego produktu" })
  }

  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  const existingImages = (product.images as Array<{ url: string }>) ?? []
  const updatedImages = existingImages
    .filter((img) => img.url !== imageUrl)
    .map((img) => ({ url: img.url }))

  const existingThumbnail: string | null = product.thumbnail ?? null
  const newThumbnail =
    existingThumbnail === imageUrl ? (updatedImages[0]?.url ?? null) : existingThumbnail

  await productService.updateProducts(product.id, {
    images: updatedImages,
    thumbnail: newThumbnail ?? undefined,
  })

  res.json({ deleted: true, images: updatedImages, thumbnail: newThumbnail })
}
