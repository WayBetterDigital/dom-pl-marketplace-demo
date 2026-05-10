import { createHash, randomUUID } from "node:crypto"

// ── Config & param types ───────────────────────────────────────────────────────

export interface P24Config {
  merchantId: number
  posId: number
  crc: string
  apiKey: string
  sandbox: boolean
}

export interface RegisterTransactionParams {
  sessionId: string
  amount: number
  currency: string
  description: string
  email: string
  country?: string
  language?: string
  urlReturn: string
  urlStatus: string
}

export interface RegisterTransactionResult {
  token: string
  redirectUrl: string
}

export interface VerifyTransactionParams {
  sessionId: string
  orderId: number
  amount: number
  currency: string
}

export interface RefundParams {
  sessionId: string
  orderId: number
  amount: number
  description?: string
}

export interface P24TransactionStatus {
  sessionId: string
  orderId: number
  amount: number
  currency: string
  status: number
}

export interface P24IpnPayload {
  merchantId: number
  posId: number
  sessionId: string
  amount: number
  originAmount: number
  currency: string
  orderId: number
  methodId: number
  statement: string
  sign: string
}

// ── Error ──────────────────────────────────────────────────────────────────────

export class P24ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = "P24ApiError"
  }
}

// ── Client ─────────────────────────────────────────────────────────────────────

export class Przelewy24Client {
  readonly baseUrl: string
  private readonly authHeader: string

  constructor(private readonly config: P24Config) {
    this.baseUrl = config.sandbox
      ? "https://sandbox.przelewy24.pl"
      : "https://secure.przelewy24.pl"

    const credentials = Buffer.from(`${config.posId}:${config.apiKey}`).toString("base64")
    this.authHeader = `Basic ${credentials}`
  }

  private sign(fields: Record<string, unknown>): string {
    return createHash("sha384").update(JSON.stringify(fields)).digest("hex")
  }

  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    const json = (await res.json()) as Record<string, unknown>

    if (!res.ok) {
      throw new P24ApiError(
        res.status,
        (json.error as string | undefined) ?? `P24 API error ${res.status}`,
      )
    }

    return ("data" in json ? json.data : json) as T
  }

  async registerTransaction(
    params: RegisterTransactionParams,
  ): Promise<RegisterTransactionResult> {
    const sign = this.sign({
      sessionId: params.sessionId,
      merchantId: this.config.merchantId,
      amount: params.amount,
      currency: params.currency,
      crc: this.config.crc,
    })

    const { token } = await this.request<{ token: string }>(
      "POST",
      "/transaction/register",
      {
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: params.sessionId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        email: params.email,
        country: params.country ?? "PL",
        language: params.language ?? "pl",
        urlReturn: params.urlReturn,
        urlStatus: params.urlStatus,
        sign,
      },
    )

    return {
      token,
      redirectUrl: `${this.baseUrl}/trnRequest/${token}`,
    }
  }

  async verifyTransaction(params: VerifyTransactionParams): Promise<void> {
    const sign = this.sign({
      sessionId: params.sessionId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      crc: this.config.crc,
    })

    await this.request("PUT", "/transaction/verify", {
      merchantId: this.config.merchantId,
      posId: this.config.posId,
      sessionId: params.sessionId,
      amount: params.amount,
      currency: params.currency,
      orderId: params.orderId,
      sign,
    })
  }

  async refund(params: RefundParams): Promise<void> {
    await this.request("POST", "/transaction/refund", {
      requestId: `refund-${params.sessionId}`,
      refundsUuid: randomUUID(),
      refunds: [
        {
          sessionId: params.sessionId,
          orderId: params.orderId,
          amount: params.amount,
          description: params.description ?? "Zwrot środków",
        },
      ],
    })
  }

  async getTransactionStatus(sessionId: string): Promise<P24TransactionStatus> {
    return this.request<P24TransactionStatus>(
      "GET",
      `/transaction/by/sessionId/${encodeURIComponent(sessionId)}`,
    )
  }

  verifyIpnSign(payload: P24IpnPayload): boolean {
    const expected = this.sign({
      merchantId: payload.merchantId,
      posId: payload.posId,
      sessionId: payload.sessionId,
      amount: payload.amount,
      originAmount: payload.originAmount,
      currency: payload.currency,
      orderId: payload.orderId,
      methodId: payload.methodId,
      statement: payload.statement,
      crc: this.config.crc,
    })

    return payload.sign === expected
  }
}
