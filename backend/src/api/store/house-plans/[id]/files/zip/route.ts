import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import archiver from "archiver"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import type HousePlanModuleService from "../../../../../../modules/house_plan/service"

// File URLs use the public S3_FILE_URL host (e.g. http://localhost:9090).
// Inside Docker the backend cannot reach that host; replace the origin with
// S3_ENDPOINT (e.g. http://minio:9000) so fetches go via the internal network.
function toInternalUrl(publicUrl: string): string {
  const fileUrl = process.env.S3_FILE_URL
  const endpoint = process.env.S3_ENDPOINT
  if (!fileUrl || !endpoint) return publicUrl
  try {
    const publicOrigin = new URL(fileUrl).origin
    const internalOrigin = new URL(endpoint).origin
    if (publicUrl.startsWith(publicOrigin)) {
      return internalOrigin + publicUrl.slice(publicOrigin.length)
    }
  } catch {
    // ignore malformed env values
  }
  return publicUrl
}

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
    const response = await fetch(toInternalUrl(file.url))
    if (!response.ok) continue
    const buffer = Buffer.from(await response.arrayBuffer())
    archive.append(buffer, { name: file.name })
  }

  await archive.finalize()
}
