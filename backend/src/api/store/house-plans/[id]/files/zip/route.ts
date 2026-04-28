import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import archiver from "archiver"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"

/**
 * GET /store/house-plans/:id/files/zip
 *
 * Streams all plan files as a single ZIP archive — no purchase verification.
 * Intended for vendors previewing/downloading their own uploaded files.
 *
 * Files are stored as public URLs, so no auth is required to fetch them.
 * The endpoint is still protected by the publishable API key via the SDK.
 *
 * Throws 404 if the plan has no files.
 */
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

  for (const file of files) {
    const response = await fetch(file.url)
    if (!response.ok) continue
    const buffer = Buffer.from(await response.arrayBuffer())
    archive.append(buffer, { name: file.name })
  }

  await archive.finalize()
}
