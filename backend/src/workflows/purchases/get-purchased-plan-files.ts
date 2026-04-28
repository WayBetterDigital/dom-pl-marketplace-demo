import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { verifyPlanPurchaseStep } from "./steps/verify-plan-purchase"
import { getPlanFilesStep } from "./steps/get-plan-files"

export type GetPurchasedPlanFilesInput = {
  customerId: string
  planId: string
}

/**
 * Core workflow for purchase-gated file access.
 *
 * Steps:
 *  1. verifyPlanPurchaseStep — throws 403 if the customer hasn't purchased the plan
 *  2. getPlanFilesStep       — returns the plan's files sorted by sort_order
 *
 * Both steps are kept separate so they can be composed into other workflows:
 *  - ZIP download workflow (Commit 3) reuses both steps
 *  - Post-payment email workflow (future) reuses getPlanFilesStep after
 *    its own payment-verified trigger — no need to re-verify purchase there
 *
 * Returns:
 *  { purchase: VerifiedPurchase, files: PlanFile[] }
 *
 * The `purchase` object (planTitle, orderId, productId) is included so
 * callers such as the ZIP endpoint can use the plan title as the archive name
 * without an additional query.
 */
export const getPurchasedPlanFilesWorkflow = createWorkflow(
  "get-purchased-plan-files",
  function (input: GetPurchasedPlanFilesInput) {
    const purchase = verifyPlanPurchaseStep({
      customerId: input.customerId,
      planId: input.planId,
    })

    const files = getPlanFilesStep({
      planId: input.planId,
    })

    return new WorkflowResponse({ purchase, files })
  }
)
