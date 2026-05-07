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
  const { filename, mimeType, content, size } = req.body as {
    filename: string
    mimeType: string
    content: string
    size: number
  }

  if (!filename || !mimeType || !content) {
    return res.status(400).json({ message: "Wymagane pola: filename, mimeType, content" })
  }

  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const existingFiles = await housePlanService.listHousePlanFiles({ house_plan_id: id })
  if (existingFiles.length >= MAX_PLAN_FILES) {
    return res.status(422).json({ message: `Maksymalna liczba plików to ${MAX_PLAN_FILES}` })
  }

  const fileService = req.scope.resolve<IFileModuleService>(Modules.FILE)

  const uploaded = await fileService.createFiles({
    filename,
    mimeType,
    content,
    access: "public",
  })

  const url = (uploaded as any).url as string

  const file = await housePlanService.createHousePlanFiles({
    house_plan_id: id,
    url,
    name: filename,
    mime_type: mimeType,
    size: size || 0,
    sort_order: existingFiles.length,
  })

  res.status(201).json({ file })
}
