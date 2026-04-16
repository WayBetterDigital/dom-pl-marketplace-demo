import { useRuntimeConfig } from '#imports'

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
  1: 'Rzut z opisami pomieszczeń'
}

export const FLOOR_OPTIONS = [
  { label: 'Piwnica', value: '-1' },
  { label: 'Parter', value: '0' },
  { label: 'Piętro 1', value: '1' },
  { label: 'Piętro 2', value: '2' },
  { label: 'Piętro 3', value: '3' }
]

export const TYPE_OPTIONS = [
  { label: 'Rzut', value: '0' },
  { label: 'Rzut z opisami', value: '1' }
]

export function useSketchService() {
  const config = useRuntimeConfig()

  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl

  const publishableKey = config.public.medusa.publishableKey as string

  async function getSketches(planId: string): Promise<HousePlanSketch[]> {
    const response = await $fetch<{ sketches: HousePlanSketch[] }>(
      `${baseUrl}/store/house-plans/${planId}/sketches`,
      { headers: { 'x-publishable-api-key': publishableKey } }
    )
    return response.sketches || []
  }

  async function createSketch(
    planId: string,
    data: { file: File, floor: number, type: SketchType, sort_order?: number }
  ): Promise<HousePlanSketch> {
    const form = new FormData()
    form.append('file', data.file)
    form.append('floor', String(data.floor))
    form.append('type', String(data.type))
    if (data.sort_order !== undefined) form.append('sort_order', String(data.sort_order))

    const res = await fetch(`${baseUrl}/store/house-plans/${planId}/sketches`, {
      method: 'POST',
      headers: { 'x-publishable-api-key': publishableKey },
      body: form
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw { data: err }
    }

    return (await res.json()).sketch
  }

  async function updateSketch(
    planId: string,
    sketchId: string,
    data: { file?: File, floor?: number, type?: SketchType, sort_order?: number }
  ): Promise<HousePlanSketch> {
    const form = new FormData()
    if (data.file) form.append('file', data.file)
    if (data.floor !== undefined) form.append('floor', String(data.floor))
    if (data.type !== undefined) form.append('type', String(data.type))
    if (data.sort_order !== undefined) form.append('sort_order', String(data.sort_order))

    const res = await fetch(`${baseUrl}/store/house-plans/${planId}/sketches/${sketchId}`, {
      method: 'POST',
      headers: { 'x-publishable-api-key': publishableKey },
      body: form
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw { data: err }
    }

    return (await res.json()).sketch
  }

  async function deleteSketch(planId: string, sketchId: string): Promise<void> {
    await $fetch(
      `${baseUrl}/store/house-plans/${planId}/sketches/${sketchId}`,
      {
        method: 'DELETE',
        headers: { 'x-publishable-api-key': publishableKey }
      }
    )
  }

  return { getSketches, createSketch, updateSketch, deleteSketch }
}
