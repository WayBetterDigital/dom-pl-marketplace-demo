export type HousePlanVendor = {
  id: string
  company_name: string
  first_name: string
  last_name: string
  email: string
  average_rating: number | null
  house_plans_count: number
}

export interface AppHousePlan {
  id: string
  title: string
  price: number
  description: string | null
  houseArea: number
  boilerRoomArea: number | null
  rooms: number
  bathroomsAndWc: number
  plotDimensions: string
  minPlotDimensionsAfterAdaptation: string | null
  floors: number
  buildingWidth: number | null
  buildingLength: number | null
  buildingFootprint: number | null
  totalArea: number | null
  roofType: string | null
  roofAngle: number | null
  garage: string | null
  architecturalStyle: string | null
  energyStandard: string | null
  basement: string | null
  buildingHeight: number | null
  fireplace: boolean | null
  terrace: boolean | null
  houseType: string | null
  thumbnail: string | null
  images: { id: string, url: string }[]
  vendor?: HousePlanVendor | null
  variantId?: string | null
  family?: { id: string, name: string } | null
}
