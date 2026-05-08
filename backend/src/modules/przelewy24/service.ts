import { AbstractPaymentProvider, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/types"
import {
  Przelewy24Client,
  P24ApiError,
  type P24Config,
  type P24IpnPayload,
} from "./przelewy24-client"

// ── Config & session data ─────────────────────────────────────────────────────

interface P24ProviderOptions extends P24Config {
  returnUrl: string
  notifyUrl: string
}

interface P24SessionData extends Record<string, unknown> {
  session_id: string
  token: string
  redirectUrl: string
  /** Amount in grosz (PLN × 100) */
  amount: number
  currency: string
  orderId?: number
}

// ── Service ───────────────────────────────────────────────────────────────────

class Przelewy24PaymentService extends AbstractPaymentProvider<P24ProviderOptions> {
  static identifier = "przelewy24"

  private readonly client: Przelewy24Client
  private readonly returnUrl: string
  private readonly notifyUrl: string

  constructor(container: Record<string, unknown>, options: P24ProviderOptions) {
    super(container, options)
    this.client = new Przelewy24Client(options)
    this.returnUrl = options.returnUrl
    this.notifyUrl = options.notifyUrl
  }

  /**
   * Medusa stores prices as-is (49.99 = 49.99 PLN).
   * P24 requires amounts in grosz (smallest unit), so we multiply by 100.
   */
  private toGrosze(amount: number): number {
    return Math.round(Number(amount) * 100)
  }

  private sessionData(data: Record<string, unknown> | undefined): P24SessionData {
    return data as unknown as P24SessionData
  }

  // ── AbstractPaymentProvider methods ──────────────────────────────────────

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, data, context } = input
    // Medusa passes the payment session's own ID via input.data.session_id
    const sessionId = data?.session_id as string
    const email = context?.customer?.email ?? ""
    const amountInGrosze = this.toGrosze(Number(amount))

    const { token, redirectUrl } = await this.client.registerTransaction({
      sessionId,
      amount: amountInGrosze,
      currency: currency_code.toUpperCase(),
      description: `Zamówienie ${sessionId}`,
      email,
      urlReturn: `${this.returnUrl}?sessionId=${sessionId}`,
      urlStatus: this.notifyUrl,
    })

    const sessionData: P24SessionData = {
      session_id: sessionId,
      token,
      redirectUrl,
      amount: amountInGrosze,
      currency: currency_code.toUpperCase(),
    }

    return { id: sessionId, data: sessionData }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Re-register with updated amount — P24 has no update API, so we create a new transaction.
    // The session_id stays the same, which reuses the same P24 session slot.
    const { amount, currency_code, data } = input
    const stored = this.sessionData(data)
    const amountInGrosze = this.toGrosze(Number(amount))

    const { token, redirectUrl } = await this.client.registerTransaction({
      sessionId: stored.session_id,
      amount: amountInGrosze,
      currency: (currency_code ?? stored.currency).toUpperCase(),
      description: `Zamówienie ${stored.session_id}`,
      email: "",
      urlReturn: `${this.returnUrl}?sessionId=${stored.session_id}`,
      urlStatus: this.notifyUrl,
    })

    return {
      data: {
        ...stored,
        token,
        redirectUrl,
        amount: amountInGrosze,
        currency: (currency_code ?? stored.currency).toUpperCase(),
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    // P24 is a redirect flow: the cart is completed before the user pays,
    // so we return PENDING here. Actual authorization happens via IPN
    // in getWebhookActionAndData.
    return { status: PaymentSessionStatus.PENDING, data: input.data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // P24 captures automatically on successful payment
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const stored = this.sessionData(input.data)

    if (!stored.orderId) {
      throw new Error("Brak P24 orderId — zwrot niemożliwy przed zakończeniem płatności")
    }

    await this.client.refund({
      sessionId: stored.session_id,
      orderId: stored.orderId,
      amount: this.toGrosze(Number(input.amount)),
    })

    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // P24 sessions expire automatically; no explicit cancel API
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const stored = this.sessionData(input.data)
    const status = await this.client.getTransactionStatus(stored.session_id)
    return { data: { ...input.data, ...status } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // P24 has no delete endpoint; session expires on their end
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const stored = this.sessionData(input.data)

    if (!stored?.session_id) return { status: PaymentSessionStatus.ERROR }

    try {
      const { status } = await this.client.getTransactionStatus(stored.session_id)
      // P24 status codes: 1 = pending, 2 = paid/completed, negative = canceled/error
      if (status >= 2) return { status: PaymentSessionStatus.AUTHORIZED }
      if (status < 0) return { status: PaymentSessionStatus.CANCELED }
      return { status: PaymentSessionStatus.PENDING }
    } catch {
      return { status: PaymentSessionStatus.ERROR }
    }
  }

  async getWebhookActionAndData(
    webhookData: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    const payload = webhookData.data as unknown as P24IpnPayload

    if (!this.client.verifyIpnSign(payload)) {
      return { action: PaymentActions.FAILED }
    }

    try {
      await this.client.verifyTransaction({
        sessionId: payload.sessionId,
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency,
      })
    } catch (err) {
      return { action: PaymentActions.FAILED }
    }

    return {
      action: PaymentActions.AUTHORIZED,
      data: {
        // session_id is the Medusa payment session ID we stored as P24's sessionId
        session_id: payload.sessionId,
        // Convert grosz back to PLN (Medusa stores amounts as-is, not in smallest unit)
        amount: payload.amount / 100,
      },
    }
  }
}

export default Przelewy24PaymentService
