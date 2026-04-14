import { useRuntimeConfig } from '#imports'
import { mapToAppVendor } from '~/utils/mappers/vendorMapper'
import { mapToAppHousePlan } from '~/utils/mappers/housePlanMapper'
import type { AppVendor, VendorApiResponse } from '~/types/vendor'
import type { AppHousePlan } from '~/types/house-plan'
import type { AppOrder } from '~/types/order'

export function useVendorService() {
  const config = useRuntimeConfig()

  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl

  const fetchOptions = {
    headers: {
      'x-publishable-api-key': config.public.medusa.publishableKey as string
    }
  }

  async function listVendors(params?: { limit?: number, offset?: number }): Promise<{ data: AppVendor[], count: number }> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.limit !== undefined) queryParams.append('limit', String(params.limit))
      if (params?.offset !== undefined) queryParams.append('offset', String(params.offset))

      const queryString = queryParams.toString()
      const url = `${baseUrl}/store/vendors${queryString ? `?${queryString}` : ''}`
      const response = await $fetch<{ vendors: VendorApiResponse[], count: number }>(url, fetchOptions)

      return {
        data: (response.vendors || []).map(mapToAppVendor),
        count: response.count || 0
      }
    }
    catch (error) {
      console.error('Failed to list vendors:', error)
      throw error
    }
  }

  async function getVendor(id: string): Promise<AppVendor> {
    try {
      const response = await $fetch<{ vendor: VendorApiResponse }>(`${baseUrl}/store/vendors/${id}`, fetchOptions)
      return mapToAppVendor(response.vendor)
    }
    catch (error) {
      console.error(`Failed to retrieve vendor with ID ${id}:`, error)
      throw error
    }
  }

  async function getVendorHousePlans(vendorId: string): Promise<AppHousePlan[]> {
    try {
      const response = await $fetch<{ house_plans: any[] }>(
        `${baseUrl}/store/vendors/${vendorId}/house-plans`,
        fetchOptions
      )
      return (response.house_plans || []).map(mapToAppHousePlan)
    }
    catch (error) {
      console.error(`Failed to retrieve house plans for vendor ${vendorId}:`, error)
      throw error
    }
  }

  async function getVendorOrders(vendorId: string) {
    const response = await $fetch<{ orders: AppOrder[] }>(
      `${baseUrl}/store/vendors/${vendorId}/orders`,
      fetchOptions
    )
    return response.orders || []
  }

  async function deleteVendorHousePlan(vendorId: string, planId: string): Promise<void> {
    await $fetch(`${baseUrl}/store/vendors/${vendorId}/house-plans/${planId}`, {
      ...fetchOptions,
      method: 'DELETE'
    })
  }

  async function createVendorHousePlan(vendorId: string, data: {
    title: string
    price: number
    description?: string
    img?: string
    house_area: number
    boiler_room_area?: number
    rooms: number
    bathrooms_and_wc: number
    plot_dimensions: string
    min_plot_dimensions_after_adaptation?: string
  }): Promise<AppHousePlan> {
    const response = await $fetch<{ house_plan: any }>(
      `${baseUrl}/store/vendors/${vendorId}/house-plans`,
      { ...fetchOptions, method: 'POST', body: data }
    )
    return mapToAppHousePlan(response.house_plan)
  }

  async function listVendorPlanFamilies(vendorId: string): Promise<{ id: string, name: string }[]> {
    const response = await $fetch<{ plan_families: { id: string, name: string }[] }>(
      `${baseUrl}/store/vendors/${vendorId}/plan-families`,
      fetchOptions
    )
    return response.plan_families || []
  }

  async function createVendorPlanFamily(vendorId: string, name: string): Promise<{ id: string, name: string }> {
    const response = await $fetch<{ plan_family: { id: string, name: string } }>(
      `${baseUrl}/store/vendors/${vendorId}/plan-families`,
      { ...fetchOptions, method: 'POST', body: { name } }
    )
    return response.plan_family
  }

  async function readFileAsBase64(file: File): Promise<{ filename: string; content: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUri = reader.result as string
        const content = dataUri.split(',')[1] ?? ''
        resolve({ filename: file.name, content, mimeType: file.type || 'image/jpeg' })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function uploadHousePlanImages(
    vendorId: string,
    planId: string,
    files: File[]
  ): Promise<{ images: { url: string }[]; thumbnail: string | null }> {
    const fileData = await Promise.all(files.map(readFileAsBase64))
    const response = await sdk.client.fetch<{ images: { url: string }[]; thumbnail: string | null }>(
      `/store/vendors/${vendorId}/house-plans/${planId}/images`,
      { method: 'POST', body: { files: fileData } }
    )
    return response
  }

  async function deleteHousePlanImage(
    vendorId: string,
    planId: string,
    imageUrl: string
  ): Promise<void> {
    await sdk.client.fetch(
      `/store/vendors/${vendorId}/house-plans/${planId}/images`,
      { method: 'DELETE', body: { url: imageUrl } }
    )
  }

  return {
    listVendors,
    getVendor,
    getVendorHousePlans,
    getVendorOrders,
    createVendorHousePlan,
    deleteVendorHousePlan,
    listVendorPlanFamilies,
    createVendorPlanFamily,
    uploadHousePlanImages,
    deleteHousePlanImage,
  }
}
