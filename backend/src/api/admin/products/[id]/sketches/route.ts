import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
import { HOUSE_PLAN_MODULE } from "../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../modules/house_plan/service"

async function resolveHousePlanId(productId: string, query: any): Promise<string | null> {
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["house_plan.id"],
    filters: { id: productId },
  })
  return (products[0]?.house_plan as any)?.id ?? null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const housePlanId = await resolveHousePlanId(id, query)
  if (!housePlanId) {
    return res.status(404).json({ message: "Brak powiązanego planu domu" })
  }

  const sketches = await housePlanService.listHousePlanSketches(
    { house_plan_id: housePlanId },
    { order: { floor: "ASC", type: "ASC" } }
  )

  res.json({ sketches })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const housePlanId = await resolveHousePlanId(id, query)
  if (!housePlanId) {
    return res.status(404).json({ message: "Brak powiązanego planu domu" })
  }

  const { filename, content, mimeType, floor, type, sort_order } = req.body as {
    filename: string
    content: string
    mimeType: string
    floor?: number
    type?: number
    sort_order?: number
  }

  if (!filename || !content || !mimeType) {
    return res.status(400).json({ message: "Wymagane: filename, content, mimeType" })
  }

  const safeFloor = floor ?? 0
  const safeType = type === 0 || type === 1 ? type : 0

  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  // Walidacja unikalności: max 1 szkic danego typu na piętro
  const existing = await housePlanService.listHousePlanSketches({
    house_plan_id: housePlanId,
    floor: safeFloor,
    type: safeType,
  })

  if (existing.length > 0) {
    const typeLabel = safeType === 0 ? "Rzut" : "Rzut z opisami"
    const floorLabel = safeFloor === 0 ? "Parter" : safeFloor === -1 ? "Piwnica" : `Piętro ${safeFloor}`
    return res.status(409).json({
      message: `${typeLabel} dla kondygnacji "${floorLabel}" już istnieje`,
    })
  }

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)

  const uploaded = await fileService.createFiles({
    filename,
    mimeType,
    content,
    access: "public",
  })

  const url = (uploaded as any).url as string

  const sketch = await housePlanService.createHousePlanSketches({
    house_plan_id: housePlanId,
    url,
    floor: safeFloor,
    type: safeType,
    sort_order: sort_order ?? 0,
  })

  res.status(201).json({ sketch })
}
