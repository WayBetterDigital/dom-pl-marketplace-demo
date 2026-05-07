import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import archiver from "archiver"
import { getPurchasedPlanFilesWorkflow } from "../../../../../../../../workflows/purchases/get-purchased-plan-files"

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

  // Files are stored as public URLs so we fetch them directly.
  // Each file is buffered individually to avoid holding all files in memory at once
  // (archiver processes them sequentially before finalizing).
  for (const file of files) {
    const response = await fetch(toInternalUrl(file.url))

    if (!response.ok) {
      // Skip undownloadable files rather than aborting the whole archive
      continue
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    archive.append(buffer, { name: file.name })
  }

  await archive.finalize()
}
