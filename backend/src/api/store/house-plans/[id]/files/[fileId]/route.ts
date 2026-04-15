import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { fileId } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const existing = await housePlanService.listHousePlanFiles({ id: fileId })
  if (!existing.length) {
    return res.status(404).json({ message: "Plik nie istnieje" })
  }

  await housePlanService.deleteHousePlanFiles(fileId)
  res.json({ deleted: true })
}
