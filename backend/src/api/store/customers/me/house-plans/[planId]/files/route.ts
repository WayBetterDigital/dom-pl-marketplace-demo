import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPurchasedPlanFilesWorkflow } from "../../../../../../../workflows/purchases/get-purchased-plan-files"

/**
 * GET /store/customers/me/house-plans/:planId/files
 *
 * Returns files for a house plan the authenticated customer has purchased.
 * The route is automatically protected by Medusa — no extra middleware needed
 * because all /store/customers/me/* paths require a valid customer session.
 *
 * Throws 404 if the plan doesn't exist.
 * Throws 403 if the customer hasn't purchased this plan.
 *
 * Response: { files: PlanFile[], plan_title: string }
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

  return res.json({
    files: result.files,
    plan_title: result.purchase.planTitle,
  })
}
