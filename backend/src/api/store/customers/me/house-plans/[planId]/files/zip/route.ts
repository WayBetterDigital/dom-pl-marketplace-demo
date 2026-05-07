import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import archiver from "archiver"
import { getPurchasedPlanFilesWorkflow } from "../../../../../../../../workflows/purchases/get-purchased-plan-files"
import { resolveInternalFileUrl } from "../../../../../../../../lib/file-url"

/**
 * GET /store/customers/me/house-plans/:planId/files/zip
 *
 * Streams all purchased plan files as a single ZIP archive.
 * Auto-protected by Medusa — /store/customers/me/* requires a valid customer session.
 *
 * Throws 404 if the plan has no files.
 * Throws 403 (via workflow) if the customer hasn't purchased this plan.
 *
 * ZIP generation is intentionally kept here, not in a workflow step, because:
 *   - It is pure I/O (fetch URLs → compress → stream response), not business logic.
 *   - Business logic (purchase verification + file retrieval) lives in the workflow.
 *   - Workflows must return serializable values — streaming a Buffer chain doesn't fit.
 *
 * To add email delivery in the future:
 *   - Create a separate workflow step that calls getPlanFilesStep, fetches buffers,
 *     uploads a ZIP to S3, and returns a presigned URL — then send that URL via email.
 *   - This route stays unchanged.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { planId } = req.params
  const customerId = req.auth_context.actor_id

  const { result } = await getPurchasedPlanFilesWorkflow(req.scope).run({
    input: { customerId, planId },
  })

  const { files, purchase } = result

  if (!files.length) {
    return res.status(404).json({
      message: "Ten projekt nie ma żadnych plików do pobrania.",
    })
  }

  // RFC 5987 encoding keeps Polish characters intact in the filename
  const zipName = `${purchase.planTitle}.zip`
  res.setHeader("Content-Type", "application/zip")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`
  )

  const archive = archiver("zip", { zlib: { level: 6 } })

  archive.on("error", () => {
    // Headers already sent — cannot send a JSON error; close the stream gracefully.
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
