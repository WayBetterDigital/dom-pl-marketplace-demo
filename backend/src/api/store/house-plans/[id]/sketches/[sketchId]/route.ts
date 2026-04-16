import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
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
    floor?: string
    type?: string
    sort_order?: string
  }

  const parsedFloor = floor !== undefined ? parseInt(floor) : undefined
  const safeType = type === "1" ? 1 : type === "0" ? 0 : undefined

  if (parsedFloor !== undefined || safeType !== undefined) {
    const current = existing[0]
    const targetFloor = parsedFloor !== undefined ? parsedFloor : current.floor
    const targetType = safeType !== undefined ? safeType : (current.type as number)

    const conflict = await housePlanService.listHousePlanSketches({
      house_plan_id: current.house_plan_id,
      floor: targetFloor,
      type: targetType,
    })
    const hasConflict = conflict.some((s) => s.id !== sketchId)
    if (hasConflict) {
      const typeLabel = targetType === 0 ? "Rzut" : "Rzut z opisami"
      const floorLabel =
        targetFloor === 0 ? "Parter" : targetFloor === -1 ? "Piwnica" : `Piętro ${targetFloor}`
      return res
        .status(409)
        .json({ message: `${typeLabel} dla kondygnacji "${floorLabel}" już istnieje` })
    }
  }

  let newUrl: string | undefined
  const multerFile = (req as any).file as { originalname: string; mimetype: string; buffer: Buffer } | undefined
  if (multerFile) {
    const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)
    const uploaded = await fileService.createFiles({
      filename: multerFile.originalname,
      mimeType: multerFile.mimetype,
      content: multerFile.buffer.toString("base64"),
      access: "public",
    })
    newUrl = (uploaded as any).url as string
  }

  const updated = await housePlanService.updateHousePlanSketches({
    id: sketchId,
    ...(newUrl !== undefined ? { url: newUrl } : {}),
    ...(parsedFloor !== undefined ? { floor: parsedFloor } : {}),
    ...(safeType !== undefined ? { type: safeType } : {}),
    ...(sort_order !== undefined ? { sort_order: parseInt(sort_order) } : {}),
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
