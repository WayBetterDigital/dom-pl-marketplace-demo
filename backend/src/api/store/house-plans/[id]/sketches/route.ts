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
  const multerFile = (req as any).file as { originalname: string; mimetype: string; buffer: Buffer } | undefined

  if (!multerFile) {
    return res.status(400).json({ message: "Wymagany plik (pole: file)" })
  }

  const { floor, type, sort_order } = req.body as {
    floor?: string
    type?: string
    sort_order?: string
  }

  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const safeFloor = floor !== undefined ? parseInt(floor) : 0
  const safeType = type === "1" ? 1 : 0

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
    filename: multerFile.originalname,
    mimeType: multerFile.mimetype,
    content: multerFile.buffer.toString("base64"),
    access: "public",
  })
  const url = (uploaded as any).url as string

  const sketch = await housePlanService.createHousePlanSketches({
    house_plan_id: id,
    url,
    floor: safeFloor,
    type: safeType,
    sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
  })

  res.status(201).json({ sketch })
}
