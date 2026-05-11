import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { toNum } from "../../../../../lib/to-num"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  if (req.auth_context?.actor_id !== id) {
    return res.status(403).json({ message: "Brak dostępu" })
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = req.scope.resolve<any>(Modules.ORDER)

  // query.graph → order meta + payment_collection IDs (no deep payment traversal — cross-module joins not wired)
  const { data: ordersMeta } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "created_at", "total", "email", "payment_collections.id", "payment_collections.status"],
    filters: { customer_id: id },
  })

  if (!(ordersMeta as any[]).length) {
    return res.json({ orders: [] })
  }

  // listOrders → items with correct unit_price and quantity values
  const ordersWithItems: any[] = await orderService.listOrders(
    { customer_id: id },
    { relations: ["items"], take: 100 }
  )

  const itemsByOrderId = new Map<string, any[]>(
    ordersWithItems.map((o) => [o.id, o.items ?? []])
  )

  // Use Payment module service to get captures and refunds per collection
  const paymentService = req.scope.resolve<any>(Modules.PAYMENT)

  const collectionIds = (ordersMeta as any[])
    .flatMap((o) => (o.payment_collections ?? []).map((c: any) => c.id))
    .filter(Boolean)

  const capturedByCollection = new Map<string, number>()
  const refundedByCollection = new Map<string, number>()

  if (collectionIds.length) {
    const payments: any[] = await paymentService.listPayments(
      { payment_collection_id: collectionIds },
      { relations: ["captures", "refunds"] }
    )
    for (const p of payments) {
      const colId = p.payment_collection_id
      const cap = (p.captures ?? []).reduce((s: number, c: any) => s + toNum(c.amount), 0)
      const ref = (p.refunds ?? []).reduce((s: number, r: any) => s + toNum(r.amount), 0)
      capturedByCollection.set(colId, (capturedByCollection.get(colId) ?? 0) + cap)
      refundedByCollection.set(colId, (refundedByCollection.get(colId) ?? 0) + ref)
    }
  }

  function derivePaymentStatus(order: any): string {
    const collections: any[] = order.payment_collections ?? []
    let totalCaptured = 0
    let totalRefunded = 0

    for (const col of collections) {
      totalCaptured += capturedByCollection.get(col.id) ?? 0
      totalRefunded += refundedByCollection.get(col.id) ?? 0
    }

    if (totalCaptured > 0) {
      if (totalRefunded >= totalCaptured) return "refunded"
      if (totalRefunded > 0) return "partially_refunded"
      return "captured"
    }

    return collections[0]?.status ?? "not_paid"
  }

  // Collect product IDs for house plan enrichment
  const productIds = ordersWithItems
    .flatMap((o) => o.items ?? [])
    .map((item: any) => item.product_id)
    .filter(Boolean)

  const productToTitle: Record<string, string> = {}
  const productToVendorName: Record<string, string> = {}
  const productToVendorId: Record<string, string> = {}
  const productToHousePlanId: Record<string, string> = {}
  const productToPrice: Record<string, number> = {}

  if (productIds.length) {
    const { data: housePlans } = await query.graph({
      entity: "house_plan",
      fields: ["id", "title", "price", "product.id", "vendor.id", "vendor.company_name"],
    })
    for (const hp of housePlans as any[]) {
      if (hp.product?.id) {
        productToTitle[hp.product.id] = hp.title
        productToVendorName[hp.product.id] = hp.vendor?.company_name ?? null
        productToVendorId[hp.product.id] = hp.vendor?.id ?? null
        productToHousePlanId[hp.product.id] = hp.id
        productToPrice[hp.product.id] = toNum(hp.price)
      }
    }
  }

  const result = (ordersMeta as any[]).map((meta) => {
    const rawItems = itemsByOrderId.get(meta.id) ?? []
    const items = rawItems.map((item: any) => ({
      id: item.id,
      title: productToTitle[item.product_id] ?? item.title ?? "",
      quantity: toNum(item.quantity),
      unit_price: toNum(item.unit_price) || productToPrice[item.product_id] || 0,
      vendor_name: productToVendorName[item.product_id] ?? null,
      vendor_id: productToVendorId[item.product_id] ?? null,
      house_plan_id: productToHousePlanId[item.product_id] ?? null,
    }))
    const itemsTotal = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0)
    return {
      id: meta.id,
      display_id: meta.display_id,
      status: meta.status,
      payment_status: derivePaymentStatus(meta),
      created_at: meta.created_at,
      total: toNum(meta.total) || itemsTotal,
      email: meta.email,
      items,
    }
  })

  res.json({ orders: result })
}
