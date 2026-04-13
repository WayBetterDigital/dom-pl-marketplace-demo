import { useMedusaClient } from '#imports'

// 0 = rzut, 1 = rzut z opisami pomieszczeń
export type SketchType = 0 | 1

export interface HousePlanSketch {
  id: string
  house_plan_id: string
  url: string
  floor: number
  type: SketchType
  sort_order: number
}

export function floorLabel(floor: number): string {
  if (floor === 0) return 'Parter'
  if (floor === -1) return 'Piwnica'
  return `Piętro ${floor}`
}

export const SKETCH_TYPE_LABEL: Record<SketchType, string> = {
  0: 'Rzut',
  1: 'Rzut z opisami pomieszczeń',
}

export function useSketchService() {
  const sdk = useMedusaClient()

  async function getSketches(planId: string): Promise<HousePlanSketch[]> {
    const response = await sdk.client.fetch<{ sketches: HousePlanSketch[] }>(
      `/store/house-plans/${planId}/sketches`
    )
    return response.sketches || []
  }

  return { getSketches }
}
