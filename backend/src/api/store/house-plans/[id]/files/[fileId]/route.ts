import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id, fileId } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const files = await housePlanService.listHousePlanFiles({ id: fileId, house_plan_id: id })
  if (!files.length) {
    return res.status(404).json({ message: "Plik nie znaleziony" })
  }

  await housePlanService.deleteHousePlanFiles(fileId)
  res.json({ deleted: true })
}
