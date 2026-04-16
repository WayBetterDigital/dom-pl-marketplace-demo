import { useRuntimeConfig } from '#imports'

export type GalleryCategory = 'wizualizacje' | 'strefa_dzienna' | 'kuchnia' | 'lazienka'
export const GALLERY_CATEGORIES: GalleryCategory[] = ['wizualizacje', 'strefa_dzienna', 'kuchnia', 'lazienka']
export const ALL_CATEGORY = 'wszystkie'

export interface GalleryImage {
  id: string
  house_plan_id: string
  url: string
  description: string | null
  category: GalleryCategory
  sort_order: number
}

export function useGalleryService() {
  const config = useRuntimeConfig()

  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl

  const fetchOptions = {
    headers: {
      'x-publishable-api-key': config.public.medusa.publishableKey as string
    }
  }

  async function getGallery(planId: string, category?: string): Promise<GalleryImage[]> {
    const params = new URLSearchParams()
    if (category && category !== ALL_CATEGORY) {
      params.append('category', category)
    }
    const path = `/store/house-plans/${planId}/gallery${params.toString() ? `?${params}` : ''}`
    const response = await $fetch<{ gallery_images: GalleryImage[] }>(`${baseUrl}${path}`, fetchOptions)
    return response.gallery_images || []
  }

  async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function uploadGalleryImage(
    vendorId: string,
    planId: string,
    file: File,
    description?: string,
    category?: GalleryCategory
  ): Promise<GalleryImage> {
    const content = await readFileAsBase64(file)
    const response = await $fetch<{ gallery_image: GalleryImage }>(
      `${baseUrl}/store/vendors/${vendorId}/house-plans/${planId}/gallery`,
      {
        ...fetchOptions,
        method: 'POST',
        body: {
          filename: file.name,
          mimeType: file.type,
          content,
          description: description || undefined,
          category: category || 'wizualizacje'
        }
      }
    )
    return response.gallery_image
  }

  async function updateGalleryImage(
    vendorId: string,
    planId: string,
    imageId: string,
    data: { description?: string; category?: GalleryCategory; sort_order?: number }
  ): Promise<GalleryImage> {
    const response = await $fetch<{ gallery_image: GalleryImage }>(
      `${baseUrl}/store/vendors/${vendorId}/house-plans/${planId}/gallery/${imageId}`,
      {
        ...fetchOptions,
        method: 'POST',
        body: data
      }
    )
    return response.gallery_image
  }

  async function deleteGalleryImage(vendorId: string, planId: string, imageId: string): Promise<void> {
    await $fetch(
      `${baseUrl}/store/vendors/${vendorId}/house-plans/${planId}/gallery/${imageId}`,
      { ...fetchOptions, method: 'DELETE' }
    )
  }

  return {
    getGallery,
    uploadGalleryImage,
    updateGalleryImage,
    deleteGalleryImage
  }
}
