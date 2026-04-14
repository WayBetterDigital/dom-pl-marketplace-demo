import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
import { HOUSE_PLAN_MODULE } from "../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../modules/house_plan/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const sketches = await housePlanService.listHousePlanSketches(
    { house_plan_id: id },
    { order: { floor: "ASC", sort_order: "ASC" } }
  )

  res.json({ sketches })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

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

  const existing = await housePlanService.listHousePlanSketches({
    house_plan_id: id,
    floor: safeFloor,
    type: safeType,
  })

  if (existing.length > 0) {
    const typeLabel = safeType === 0 ? "Rzut" : "Rzut z opisami"
    const floorLabel =
      safeFloor === 0 ? "Parter" : safeFloor === -1 ? "Piwnica" : `Piętro ${safeFloor}`
    return res
      .status(409)
      .json({ message: `${typeLabel} dla kondygnacji "${floorLabel}" już istnieje` })
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
    house_plan_id: id,
    url,
    floor: safeFloor,
    type: safeType,
    sort_order: sort_order ?? 0,
  })

  res.status(201).json({ sketch })
}
