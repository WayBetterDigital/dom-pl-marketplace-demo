import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HOUSE_PLAN_MODULE } from "../../../modules/house_plan"
import HousePlanModuleService from "../../../modules/house_plan/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const housePlanService: HousePlanModuleService =
    req.scope.resolve(HOUSE_PLAN_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { limit = 12, offset = 0, ...rawFilters } = req.query as any

  const NUMERIC_FIELDS = ["floors", "rooms", "bathrooms_and_wc", "roof_angle"]
  const filters: Record<string, any> = {}
  for (const [key, val] of Object.entries(rawFilters)) {
    filters[key] = NUMERIC_FIELDS.includes(key) ? Number(val) : val
  }

  const [house_plans, count] = await housePlanService.listAndCountHousePlans(filters, {
    skip: Number(offset),
    take: Number(limit),
    relations: ["family"],
  })

  if (house_plans.length > 0) {
    const ids = house_plans.map((p) => p.id)
    const { data: enriched } = await query.graph({
      entity: "house_plan",
      fields: [
        "id",
        "product.thumbnail",
        "product.images.id",
        "product.images.url",
      ],
      filters: { id: ids },
    })

    const productMap = new Map(enriched.map((e: any) => [e.id, e.product]))
    for (const plan of house_plans) {
      ;(plan as any).product = productMap.get(plan.id) ?? null
    }
  }

  res.json({
    house_plans,
    count,
    limit: Number(limit),
    offset: Number(offset),
  })
}
