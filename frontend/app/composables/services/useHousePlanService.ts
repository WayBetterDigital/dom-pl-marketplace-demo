import { useRuntimeConfig } from '#imports'
import { mapToAppHousePlan } from '~/utils/mappers/housePlanMapper'
import type { AppHousePlan } from '~/types/house-plan'

export interface HousePlanListParams {
  limit?: number
  offset?: number
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  rooms?: number
  floors?: number
  garage?: string
  basement?: string
  houseType?: string
  architecturalStyle?: string
  energyStandard?: string
  familyId?: string
}

export function useHousePlanService() {
  const config = useRuntimeConfig()

  // SSR uses internal Docker URL; browser uses public URL
  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl

  const fetchOptions = {
    headers: {
      'x-publishable-api-key': config.public.medusa.publishableKey as string
    }
  }

  async function listHousePlans(params?: HousePlanListParams): Promise<{ data: AppHousePlan[], count: number, limit: number, offset: number }> {
    try {
      const queryParams = new URLSearchParams()

      if (params) {
        if (params.limit !== undefined) queryParams.append('limit', String(params.limit))
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset))

        if (params.minPrice !== undefined) queryParams.append('price[$gte]', String(params.minPrice))
        if (params.maxPrice !== undefined) queryParams.append('price[$lte]', String(params.maxPrice))

        if (params.minArea !== undefined) queryParams.append('house_area[$gte]', String(params.minArea))
        if (params.maxArea !== undefined) queryParams.append('house_area[$lte]', String(params.maxArea))

        if (params.rooms !== undefined) queryParams.append('rooms', String(params.rooms))
        if (params.floors !== undefined) queryParams.append('floors', String(params.floors))
        if (params.garage !== undefined) queryParams.append('garage', params.garage)
        if (params.basement !== undefined) queryParams.append('basement', params.basement)
        if (params.houseType !== undefined) queryParams.append('house_type', params.houseType)
        if (params.architecturalStyle !== undefined) queryParams.append('architectural_style', params.architecturalStyle)
        if (params.energyStandard !== undefined) queryParams.append('energy_standard', params.energyStandard)
        if (params.familyId !== undefined) queryParams.append('family_id', params.familyId)
      }

      const queryString = queryParams.toString()
      const url = `${baseUrl}/store/house-plans${queryString ? `?${queryString}` : ''}`
      const response = await $fetch<{ house_plans: any[], count: number, limit: number, offset: number }>(url, fetchOptions)

      return {
        data: (response.house_plans || []).map(mapToAppHousePlan),
        count: response.count || 0,
        limit: response.limit || 0,
        offset: response.offset || 0
      }
    }
    catch (error) {
      console.error('Failed to list house plans:', error)
      throw error
    }
  }

  async function getHousePlan(id: string): Promise<AppHousePlan> {
    try {
      const response = await $fetch<{ house_plan: any }>(`${baseUrl}/store/house-plans/${id}`, fetchOptions)
      return mapToAppHousePlan(response.house_plan)
    }
    catch (error) {
      console.error(`Failed to retrieve house plan with ID ${id}:`, error)
      throw error
    }
  }

  return {
    listHousePlans,
    getHousePlan
  }
}
