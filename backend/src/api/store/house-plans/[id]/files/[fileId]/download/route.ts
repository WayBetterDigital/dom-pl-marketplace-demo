import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOUSE_PLAN_MODULE } from "../../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../../modules/house_plan/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id, fileId } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const files = await housePlanService.listHousePlanFiles({ id: fileId, house_plan_id: id })
  const file = files[0]
  if (!file) {
    return res.status(404).json({ message: "Plik nie znaleziony" })
  }

  let upstream: Response
  try {
    upstream = await fetch(file.url)
  } catch {
    return res.status(502).json({ message: "Nie udało się pobrać pliku ze źródła" })
  }

  if (!upstream.ok) {
    return res.status(502).json({ message: "Źródło pliku zwróciło błąd" })
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())

  res.setHeader("Content-Type", file.mime_type || "application/octet-stream")
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`)
  res.setHeader("Content-Length", String(buffer.length))
  res.send(buffer)
}
