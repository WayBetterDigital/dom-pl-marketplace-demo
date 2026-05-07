import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

export type VerifyPlanPurchaseInput = {
  customerId: string
  planId: string
}

/**
 * Resolved when a customer has purchased a plan.
 * Returned to downstream steps so they don't need to re-query the plan.
 */
export type VerifiedPurchase = {
  planId: string
  planTitle: string
  productId: string
  orderId: string
}

/**
 * Verifies that a customer has purchased a given house plan.
 *
 * Throws MedusaError.NOT_FOUND  if the plan or its product link doesn't exist.
 * Throws MedusaError.NOT_ALLOWED if the customer has no order containing this plan.
 *
 * Designed to be the single source of truth for purchase gating:
 * - File list endpoint (Commit 2) calls this step via the workflow
 * - ZIP download endpoint (Commit 3) calls this step via the workflow
 * - Email notification workflow (future) can reuse this step
 *
 * To enforce payment status in the future, add an `allowedStatuses` input field
 * and filter `orders` by status before checking for the product.
 */
export const verifyPlanPurchaseStep = createStep(
  "verify-plan-purchase",
  async ({ customerId, planId }: VerifyPlanPurchaseInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const orderModule = container.resolve<any>(Modules.ORDER)

    // Resolve the Medusa product linked to this house plan
    const { data: plans } = await query.graph({
      entity: "house_plan",
      fields: ["id", "title", "product.id"],
      filters: { id: planId },
    })

    const plan = (plans as any[])[0]

    if (!plan) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Plan domowy o id "${planId}" nie istnieje.`
      )
    }

    const productId = plan.product?.id as string | undefined

    if (!productId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Plan domowy "${planId}" nie jest powiązany z produktem.`
      )
    }

    // Fetch all customer orders (including items) and check for the product.
    // Customer order history is always small (<< 200), so JS-side filtering is fine here.
    // If cross-module filtering via query.index() becomes necessary in the future,
    // replace this block with a query.index() call.
    const orders = await orderModule.listOrders(
      { customer_id: customerId },
      { relations: ["items"], take: 200 }
    )

    const purchasedOrder = (orders as any[]).find((order: any) =>
      (order.items ?? []).some((item: any) => item.product_id === productId)
    )

    if (!purchasedOrder) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Nie masz dostępu do plików tego projektu. Kup projekt, aby uzyskać dostęp."
      )
    }

    return new StepResponse<VerifiedPurchase>({
      planId: plan.id as string,
      planTitle: plan.title as string,
      productId,
      orderId: purchasedOrder.id as string,
    })
  }
)
