import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import archiver from "archiver"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"
import { resolveInternalFileUrl } from "../../../../../../lib/file-url"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const housePlanService = req.scope.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

  const [plan, files] = await Promise.all([
    housePlanService.retrieveHousePlan(id),
    housePlanService.listHousePlanFiles(
      { house_plan_id: id },
      { order: { sort_order: "ASC", created_at: "ASC" } }
    ),
  ])

  if (!files.length) {
    return res.status(404).json({ message: "Ten projekt nie ma żadnych plików do pobrania." })
  }

  const zipName = `${plan.title}.zip`
  res.setHeader("Content-Type", "application/zip")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`
  )

  const archive = archiver("zip", { zlib: { level: 6 } })

  archive.on("error", () => {
    res.end()
  })

  archive.pipe(res as any)

  const fetched = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(resolveInternalFileUrl(file.url))
      if (!response.ok) return null
      return { name: file.name, buffer: Buffer.from(await response.arrayBuffer()) }
    })
  )

  for (const item of fetched) {
    if (item) archive.append(item.buffer, { name: item.name })
  }

  await archive.finalize()
}
