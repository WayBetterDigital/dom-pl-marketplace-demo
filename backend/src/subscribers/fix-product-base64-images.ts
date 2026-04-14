import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService, IProductModuleService } from "@medusajs/framework/types"

// In-memory lock: prevents concurrent subscriber runs for the same product.
const inProgress = new Set<string>()

// Cooldown: prevents sequential duplicate runs within 10 s.
const lastConverted = new Map<string, number>()
const COOLDOWN_MS = 10_000

function isBase64DataUri(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:")
}

async function uploadBase64ToMinIO(
  fileService: IFileModuleService,
  dataUri: string
): Promise<string> {
  const [header, content] = dataUri.split(",")
  const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg"
  const ext = mimeType.split("/")[1]?.split("+")[0] ?? "jpg"
  const filename = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const file = await fileService.createFiles({ filename, mimeType, content, access: "public" })
  return file.url
}

export default async function fixProductBase64Images({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  if (inProgress.has(data.id)) {
    logger.info(`[fix-product-images] ${data.id} — w trakcie konwersji, pomijam`)
    return
  }

  const lastTime = lastConverted.get(data.id) ?? 0
  if (Date.now() - lastTime < COOLDOWN_MS) {
    logger.info(`[fix-product-images] ${data.id} — cooldown aktywny, pomijam`)
    return
  }

  inProgress.add(data.id)

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "thumbnail", "images.id", "images.url"],
      filters: { id: data.id },
    })

    const product = products[0]
    if (!product) return

    const hasThumbnailBase64 = isBase64DataUri(product.thumbnail)
    const base64Images = ((product.images as any[]) ?? []).filter((img) =>
      isBase64DataUri(img?.url)
    )

    // Guard: nothing to convert → avoids infinite loop after we update the product
    if (!hasThumbnailBase64 && base64Images.length === 0) return

    logger.info(`[fix-product-images] ${data.id} — konwertuję do MinIO`)

    const fileService = container.resolve<IFileModuleService>(Modules.FILE)
    const productService = container.resolve<IProductModuleService>(Modules.PRODUCT)

    // Deduplicate uploads: Medusa admin sends the same new image 2 times
    const uploadCache = new Map<string, string>()

    async function uploadOnce(dataUri: string): Promise<string> {
      const key = dataUri.slice(0, 200)
      if (uploadCache.has(key)) {
        return uploadCache.get(key)!
      }
      const url = await uploadBase64ToMinIO(fileService, dataUri)
      uploadCache.set(key, url)
      return url
    }

    const newThumbnail = hasThumbnailBase64
      ? await uploadOnce(product.thumbnail as string)
      : (product.thumbnail as string | null)

    const newImages = await Promise.all(
      base64Images.map(async (img) => ({
        id: img.id as string,
        url: await uploadOnce(img.url),
      }))
    )

    const galleryImages = newImages.filter((img) => img.url !== newThumbnail)

    await productService.updateProducts(data.id, {
      thumbnail: newThumbnail ?? undefined,
      images: galleryImages,
    })

    logger.info(
      `[fix-product-images] ${data.id} — gotowe. thumbnail: ${newThumbnail?.slice(0, 60)}, galeria: ${galleryImages.length} zdjęć`
    )
  } catch (err: any) {
    logger.error(`[fix-product-images] ${data.id} — błąd: ${err?.message}`)
  } finally {
    lastConverted.set(data.id, Date.now())
    inProgress.delete(data.id)
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
