import type { AppHousePlan } from '~/types/house-plan'
import type { CreateVendorHousePlanPayload, UpdateVendorHousePlanPayload } from '~/composables/services/useVendorService'

export type VendorPlanForm = {
  title: string
  price: string
  description: string
  house_area: string
  boiler_room_area: string
  rooms: string
  bathrooms_and_wc: string
  plot_dimensions: string
  min_plot_dimensions_after_adaptation: string
  floors: string
  building_width: string
  building_length: string
  building_footprint: string
  total_area: string
  roof_type: string
  roof_angle: string
  garage: string
  architectural_style: string
  energy_standard: string
  basement: string
  building_height: string
  fireplace: string
  terrace: string
  house_type: string
}

const emptyFormState = (): VendorPlanForm => ({
  title: '',
  price: '',
  description: '',
  house_area: '',
  boiler_room_area: '',
  rooms: '',
  bathrooms_and_wc: '',
  plot_dimensions: '',
  min_plot_dimensions_after_adaptation: '',
  floors: '',
  building_width: '',
  building_length: '',
  building_footprint: '',
  total_area: '',
  roof_type: '',
  roof_angle: '',
  garage: '',
  architectural_style: '',
  energy_standard: '',
  basement: '',
  building_height: '',
  fireplace: '',
  terrace: '',
  house_type: '',
})

const toNumber = (value: string): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const boolFromTakNie = (value: string): boolean | undefined => {
  if (value === 'tak') return true
  if (value === 'nie') return false
  return undefined
}

const boolToTakNie = (value: boolean | null): string => {
  if (value === true) return 'tak'
  if (value === false) return 'nie'
  return ''
}

const numberToForm = (value: number | null): string => {
  if (value == null || Number.isNaN(value)) return ''
  return String(value)
}

const prefillFromPlan = (plan: AppHousePlan): Partial<VendorPlanForm> => ({
  description: plan.description ?? '',
  house_area: numberToForm(plan.houseArea),
  boiler_room_area: numberToForm(plan.boilerRoomArea),
  rooms: numberToForm(plan.rooms),
  bathrooms_and_wc: numberToForm(plan.bathroomsAndWc),
  plot_dimensions: plan.plotDimensions ?? '',
  min_plot_dimensions_after_adaptation: plan.minPlotDimensionsAfterAdaptation ?? '',
  floors: numberToForm(plan.floors),
  building_width: numberToForm(plan.buildingWidth),
  building_length: numberToForm(plan.buildingLength),
  building_footprint: numberToForm(plan.buildingFootprint),
  total_area: numberToForm(plan.totalArea),
  roof_type: plan.roofType ?? '',
  roof_angle: numberToForm(plan.roofAngle),
  garage: plan.garage ?? '',
  architectural_style: plan.architecturalStyle ?? '',
  energy_standard: plan.energyStandard ?? '',
  basement: plan.basement ?? '',
  building_height: numberToForm(plan.buildingHeight),
  fireplace: boolToTakNie(plan.fireplace),
  terrace: boolToTakNie(plan.terrace),
  house_type: plan.houseType ?? '',
})

export function useVendorPlanForm() {
  const form = ref<VendorPlanForm>(emptyFormState())
  const errors = ref<Partial<Record<keyof VendorPlanForm, string>>>({})

  const roofLabel = computed(() => {
    const parts = []
    if (form.value.roof_type) parts.push(form.value.roof_type)
    if (form.value.roof_angle) parts.push(`${form.value.roof_angle}°`)
    return parts.join(', ') || null
  })

  const dimensionsLabel = computed(() => {
    if (form.value.building_width && form.value.building_length) {
      return `${form.value.building_width} × ${form.value.building_length} m`
    }
    return null
  })

  const validate = () => {
    const next: Partial<Record<keyof VendorPlanForm, string>> = {}
    if (!form.value.title.trim()) next.title = 'Tytuł jest wymagany'
    if (!toNumber(form.value.price)) next.price = 'Podaj poprawną cenę'
    if (!toNumber(form.value.house_area)) next.house_area = 'Podaj powierzchnię użytkową'
    if (!toNumber(form.value.rooms)) next.rooms = 'Podaj liczbę pokoi'
    if (!toNumber(form.value.bathrooms_and_wc)) next.bathrooms_and_wc = 'Podaj liczbę łazienek i WC'
    if (!form.value.plot_dimensions.trim()) next.plot_dimensions = 'Podaj minimalne wymiary działki'
    errors.value = next
    return Object.keys(next).length === 0
  }

  const toCreatePayload = (): CreateVendorHousePlanPayload => {
    const requiredNumber = (value: string) => Number(value)
    return {
      title: form.value.title.trim(),
      price: requiredNumber(form.value.price),
      house_area: requiredNumber(form.value.house_area),
      rooms: requiredNumber(form.value.rooms),
      bathrooms_and_wc: requiredNumber(form.value.bathrooms_and_wc),
      plot_dimensions: form.value.plot_dimensions.trim(),
      ...(form.value.description.trim() && { description: form.value.description.trim() }),
      ...(toNumber(form.value.boiler_room_area) !== undefined && { boiler_room_area: toNumber(form.value.boiler_room_area) }),
      ...(form.value.min_plot_dimensions_after_adaptation.trim() && {
        min_plot_dimensions_after_adaptation: form.value.min_plot_dimensions_after_adaptation.trim()
      }),
      ...(toNumber(form.value.floors) !== undefined && { floors: toNumber(form.value.floors) }),
      ...(toNumber(form.value.building_width) !== undefined && { building_width: toNumber(form.value.building_width) }),
      ...(toNumber(form.value.building_length) !== undefined && { building_length: toNumber(form.value.building_length) }),
      ...(toNumber(form.value.building_footprint) !== undefined && { building_footprint: toNumber(form.value.building_footprint) }),
      ...(toNumber(form.value.total_area) !== undefined && { total_area: toNumber(form.value.total_area) }),
      ...(form.value.roof_type && { roof_type: form.value.roof_type }),
      ...(toNumber(form.value.roof_angle) !== undefined && { roof_angle: toNumber(form.value.roof_angle) }),
      ...(form.value.garage && { garage: form.value.garage }),
      ...(form.value.architectural_style && { architectural_style: form.value.architectural_style }),
      ...(form.value.energy_standard && { energy_standard: form.value.energy_standard }),
      ...(form.value.basement && { basement: form.value.basement }),
      ...(toNumber(form.value.building_height) !== undefined && { building_height: toNumber(form.value.building_height) }),
      ...(boolFromTakNie(form.value.fireplace) !== undefined && { fireplace: boolFromTakNie(form.value.fireplace) }),
      ...(boolFromTakNie(form.value.terrace) !== undefined && { terrace: boolFromTakNie(form.value.terrace) }),
      ...(form.value.house_type && { house_type: form.value.house_type }),
    }
  }

  const toUpdatePayload = (): UpdateVendorHousePlanPayload => toCreatePayload()

  const loadFromPlan = (plan: AppHousePlan) => {
    form.value = {
      ...emptyFormState(),
      title: plan.title ?? '',
      price: numberToForm(plan.price),
      ...prefillFromPlan(plan),
    }
  }

  const applyPrefillToEmptyFields = (plan: AppHousePlan) => {
    const prefill = prefillFromPlan(plan)
    const next = { ...form.value }

    for (const [key, value] of Object.entries(prefill)) {
      const typedKey = key as keyof VendorPlanForm
      if (typeof value !== 'string' || !value.trim()) continue
      if (!next[typedKey].trim()) next[typedKey] = value
    }

    form.value = next
  }

  const reset = () => {
    form.value = emptyFormState()
    errors.value = {}
  }

  return {
    form,
    errors,
    roofLabel,
    dimensionsLabel,
    validate,
    toCreatePayload,
    toUpdatePayload,
    loadFromPlan,
    applyPrefillToEmptyFields,
    reset,
  }
}
