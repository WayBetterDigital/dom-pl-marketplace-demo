import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOUSE_PLAN_MODULE } from "../../../modules/house_plan"
import HousePlanModuleService from "../../../modules/house_plan/service"
import { CreateHousePlanSchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const housePlanService: HousePlanModuleService =
    req.scope.resolve(HOUSE_PLAN_MODULE)

  const limit = Number(req.query.limit ?? 12)
  const offset = Number(req.query.offset ?? 0)

  const [plans, count] = await housePlanService.listAndCountHousePlans({}, {
    skip: offset,
    take: limit,
  })

  res.json({ house_plans: plans, count, limit, offset })
}

export async function POST(
  req: MedusaRequest<CreateHousePlanSchema>,
  res: MedusaResponse
) {
  const housePlanService: HousePlanModuleService =
    req.scope.resolve(HOUSE_PLAN_MODULE)

  const house_plan = await housePlanService.createHousePlans(req.validatedBody)

  res.status(201).json({ house_plan })
}
