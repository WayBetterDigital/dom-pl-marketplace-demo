import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IPaymentModuleService } from "@medusajs/framework/types"
import { processPaymentWorkflow } from "@medusajs/core-flows"

/**
 * POST /webhooks/przelewy24
 *
 * Receives IPN (Instant Payment Notification) from Przelewy24.
 *
 * Flow:
 *   1. Payment module calls our provider's getWebhookActionAndData:
 *      - verifies the CRC signature on the payload
 *      - verifies the transaction with P24 API (PUT /transaction/verify)
 *      - returns { action: "authorized", data: { session_id, amount } }
 *   2. processPaymentWorkflow authorizes the payment session and completes the cart,
 *      creating the order in Medusa.
 *   3. We respond with "OK" — P24 requires this exact body on a 200 to stop retrying.
 *
 * This route is intentionally unauthenticated — P24 calls it directly.
 * Security is handled by the CRC signature check in the payment provider.
 *
 * Non-200 responses cause P24 to retry delivery (useful for transient errors).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const paymentModule = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)

  const actionResult = await paymentModule.getWebhookActionAndData({
    provider: "pp_przelewy24_default",
    payload: {
      data: req.body as Record<string, unknown>,
      rawData: JSON.stringify(req.body),
      headers: req.headers as Record<string, unknown>,
    },
  })

  await processPaymentWorkflow(req.scope).run({ input: actionResult })

  res.status(200).send("OK")
}
