import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

function toNum(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return val
  if (typeof val === "string") return parseFloat(val) || 0
  if (typeof val === "object") {
    if ("numeric_value" in val) return Number(val.numeric_value) || 0
    if ("numeric" in val) return Number(val.numeric) || 0
    if ("value" in val) return parseFloat(String(val.value)) || 0
  }
  return 0
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = req.scope.resolve<any>(Modules.ORDER)

  // query.graph → scalar fields + payment_collections.status (admin reads from payment_collections, not order.payment_status)
  const { data: ordersMeta } = await query.graph({
    entity: "order",
    fields: ["id", "status", "payment_status", "created_at", "total", "email", "payment_collections.status"],
    filters: { customer_id: id },
  })

  if (!(ordersMeta as any[]).length) {
    return res.json({ orders: [] })
  }

  // listOrders → items with correct unit_price/quantity values + payment_status (query.graph doesn't expose it)
  const ordersWithItems: any[] = await orderService.listOrders(
    { customer_id: id },
    {
      select: ["id", "status", "payment_status", "customer_id", "created_at", "total", "email"],
      relations: ["items"],
      take: 100,
    }
  )

  const itemsByOrderId = new Map<string, any[]>(
    ordersWithItems.map((o) => [o.id, o.items ?? []])
  )

  const paymentStatusById = new Map<string, string | undefined>(
    ordersWithItems.map((o) => [o.id, o.payment_status])
  )

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
      status: meta.status,
      // Prefer listOrders field, then payment_collections (what admin reads), then fallback
      payment_status:
        paymentStatusById.get(meta.id) ||
        (meta as any).payment_collections?.[0]?.status ||
        "not_paid",
      created_at: meta.created_at,
      total: toNum(meta.total) || itemsTotal,
      email: meta.email,
      items,
    }
  })

  res.json({ orders: result })
}
