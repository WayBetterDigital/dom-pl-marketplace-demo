import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { sketchId } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const existing = await housePlanService.listHousePlanSketches({ id: sketchId })
  if (!existing.length) {
    return res.status(404).json({ message: "Szkic nie istnieje" })
  }

  const { floor, type, sort_order } = req.body as {
    floor?: number
    type?: number
    sort_order?: number
  }

  const safeType = type === 0 || type === 1 ? type : undefined

  // Walidacja unikalności przy zmianie piętra lub typu
  if (floor !== undefined || safeType !== undefined) {
    const current = existing[0]
    const targetFloor = floor !== undefined ? floor : current.floor
    const targetType = safeType !== undefined ? safeType : (current.type as number)

    if (floor !== undefined || safeType !== undefined) {
      const conflict = await housePlanService.listHousePlanSketches({
        house_plan_id: current.house_plan_id,
        floor: targetFloor,
        type: targetType,
      })
      const hasConflict = conflict.some((s) => s.id !== sketchId)
      if (hasConflict) {
        const typeLabel = targetType === 0 ? "Rzut" : "Rzut z opisami"
        const floorLabel = targetFloor === 0 ? "Parter" : targetFloor === -1 ? "Piwnica" : `Piętro ${targetFloor}`
        return res.status(409).json({
          message: `${typeLabel} dla kondygnacji "${floorLabel}" już istnieje`,
        })
      }
    }
  }

  const updated = await housePlanService.updateHousePlanSketches({
    id: sketchId,
    ...(floor !== undefined ? { floor } : {}),
    ...(safeType !== undefined ? { type: safeType } : {}),
    ...(sort_order !== undefined ? { sort_order } : {}),
  })

  res.json({ sketch: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { sketchId } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const existing = await housePlanService.listHousePlanSketches({ id: sketchId })
  if (!existing.length) {
    return res.status(404).json({ message: "Szkic nie istnieje" })
  }

  await housePlanService.deleteHousePlanSketches(sketchId)
  res.json({ deleted: true })
}
