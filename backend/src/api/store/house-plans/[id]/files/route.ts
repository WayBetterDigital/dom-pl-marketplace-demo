import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/framework/types"
import { HOUSE_PLAN_MODULE } from "../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../modules/house_plan/service"
import { MAX_PLAN_FILES } from "../../../../../lib/file-limits"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const files = await housePlanService.listHousePlanFiles(
    { house_plan_id: id },
    { order: { sort_order: "ASC", created_at: "ASC" } }
  )

  res.json({ files })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const multerFile = (req as any).file as { originalname: string; mimetype: string; buffer: Buffer; size: number } | undefined

  if (!multerFile) {
    return res.status(400).json({ message: "Wymagany plik (pole: file)" })
  }

  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const existingFiles = await housePlanService.listHousePlanFiles({ house_plan_id: id })
  if (existingFiles.length >= MAX_PLAN_FILES) {
    return res.status(422).json({ message: `Maksymalna liczba plików to ${MAX_PLAN_FILES}` })
  }

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)

  const uploaded = await fileService.createFiles({
    filename: multerFile.originalname,
    mimeType: multerFile.mimetype,
    content: multerFile.buffer.toString("base64"),
    access: "public",
  })
  const url = (uploaded as any).url as string

  const file = await housePlanService.createHousePlanFiles({
    house_plan_id: id,
    url,
    name: multerFile.originalname,
    mime_type: multerFile.mimetype,
    size: multerFile.size,
    sort_order: existingFiles.length,
  })

  res.status(201).json({ file })
}
