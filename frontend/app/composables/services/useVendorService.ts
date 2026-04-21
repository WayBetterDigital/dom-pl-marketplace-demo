import { useMedusaClient, useRuntimeConfig } from '#imports'
import { mapToAppVendor } from '~/utils/mappers/vendorMapper'
import { mapToAppHousePlan } from '~/utils/mappers/housePlanMapper'
import type { AppVendor, VendorApiResponse } from '~/types/vendor'
import type { AppHousePlan } from '~/types/house-plan'
import type { AppOrder } from '~/types/order'

export interface VendorHousePlanPayload {
  title: string
  price: number
  description?: string
  house_area: number
  boiler_room_area?: number
  rooms: number
  bathrooms_and_wc: number
  plot_dimensions: string
  min_plot_dimensions_after_adaptation?: string
  floors?: number
  building_width?: number
  building_length?: number
  building_footprint?: number
  total_area?: number
  roof_type?: string
  roof_angle?: number
  garage?: string
  architectural_style?: string
  energy_standard?: string
  basement?: string
  building_height?: number
  fireplace?: boolean
  terrace?: boolean
  house_type?: string
  family_id?: string
}

export type CreateVendorHousePlanPayload = VendorHousePlanPayload
export type UpdateVendorHousePlanPayload = Partial<VendorHousePlanPayload>

export function useVendorService() {
  const sdk = useMedusaClient()
  const config = useRuntimeConfig()

  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl

  const fetchOptions = {
    headers: {
      'x-publishable-api-key': config.public.medusa.publishableKey as string
    }
  }

  function authFetchOptions() {
    const token = import.meta.client ? localStorage.getItem('vendor_auth_token') : null
    return {
      headers: {
        'x-publishable-api-key': config.public.medusa.publishableKey as string,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
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
      ...authFetchOptions(),
      method: 'DELETE'
    })
  }

  async function createVendorHousePlan(
    vendorId: string,
    data: CreateVendorHousePlanPayload
  ): Promise<AppHousePlan> {
    const response = await $fetch<{ house_plan: any }>(
      `${baseUrl}/store/vendors/${vendorId}/house-plans`,
      { ...authFetchOptions(), method: 'POST', body: data }
    )
    return mapToAppHousePlan(response.house_plan)
  }

  async function updateVendorHousePlan(
    vendorId: string,
    planId: string,
    data: UpdateVendorHousePlanPayload
  ): Promise<AppHousePlan> {
    const response = await $fetch<{ house_plan: any }>(
      `${baseUrl}/store/vendors/${vendorId}/house-plans/${planId}`,
      { ...authFetchOptions(), method: 'POST', body: data }
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
      { ...authFetchOptions(), method: 'POST', body: { name } }
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
    const token = import.meta.client ? localStorage.getItem('vendor_auth_token') : null
    const response = await sdk.client.fetch<{ images: { url: string }[]; thumbnail: string | null }>(
      `/store/vendors/${vendorId}/house-plans/${planId}/images`,
      {
        method: 'POST',
        body: { files: fileData },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
    return response
  }

  async function deleteHousePlanImage(
    vendorId: string,
    planId: string,
    imageUrl: string
  ): Promise<void> {
    const token = import.meta.client ? localStorage.getItem('vendor_auth_token') : null
    await sdk.client.fetch(
      `/store/vendors/${vendorId}/house-plans/${planId}/images`,
      {
        method: 'DELETE',
        body: { url: imageUrl },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
  }

  return {
    listVendors,
    getVendor,
    getVendorHousePlans,
    getVendorOrders,
    createVendorHousePlan,
    updateVendorHousePlan,
    deleteVendorHousePlan,
    listVendorPlanFamilies,
    createVendorPlanFamily,
    uploadHousePlanImages,
    deleteHousePlanImage,
  }
}
