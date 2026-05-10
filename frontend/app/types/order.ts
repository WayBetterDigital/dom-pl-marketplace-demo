export type AppOrderItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  vendor_name?: string | null
  vendor_id?: string | null
  house_plan_id?: string | null
}

export type AppOrder = {
  id: string
  status: string
  payment_status?: string
  created_at: string
  total: number
  email: string
  items: AppOrderItem[]
}
