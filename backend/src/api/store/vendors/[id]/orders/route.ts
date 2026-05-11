import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { toNum } from "../../../../../lib/to-num"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = req.scope.resolve<any>(Modules.ORDER)

  // Step 1: get this vendor's house plans and product IDs
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: ["id", "house_plans.id", "house_plans.title", "house_plans.price", "house_plans.product.id"],
    filters: { id },
  })

  const housePlans: any[] = vendors[0]?.house_plans ?? []
  const productIds = housePlans.map((hp) => hp.product?.id).filter(Boolean) as string[]

  if (!productIds.length) {
    return res.json({ orders: [] })
  }

  const productToTitle: Record<string, string> = {}
  const productToHousePlanId: Record<string, string> = {}
  const productToPrice: Record<string, number> = {}
  for (const hp of housePlans) {
    if (hp.product?.id) {
      productToTitle[hp.product.id] = hp.title
      productToHousePlanId[hp.product.id] = hp.id
      productToPrice[hp.product.id] = toNum(hp.price)
    }
  }

  // Step 2: query.graph → order metadata (status, created_at, email — serialized correctly)
  const { data: allOrdersMeta } = await query.graph({
    entity: "order",
    fields: ["id", "status", "created_at", "total", "email"],
  })

  // Step 3: listOrders → items with correct unit_price and quantity
  const allOrdersWithItems: any[] = await orderService.listOrders(
    {},
    { relations: ["items"], take: 1000 }
  )

  const itemsByOrderId = new Map<string, any[]>(
    allOrdersWithItems.map((o) => [o.id, o.items ?? []])
  )

  // Step 4: filter to orders containing this vendor's products and build result
  const metaMap = new Map((allOrdersMeta as any[]).map((o) => [o.id, o]))

  const vendorOrders = allOrdersWithItems
    .filter((o) =>
      (o.items ?? []).some((item: any) => productIds.includes(item.product_id))
    )
    .map((o) => {
      const meta = metaMap.get(o.id) ?? {}
      const rawItems = itemsByOrderId.get(o.id) ?? []
      const items = rawItems
        .filter((item: any) => productIds.includes(item.product_id))
        .map((item: any) => ({
          id: item.id,
          title: productToTitle[item.product_id] ?? item.title ?? "",
          quantity: toNum(item.quantity),
          unit_price: toNum(item.unit_price) || productToPrice[item.product_id] || 0,
          house_plan_id: productToHousePlanId[item.product_id] ?? null,
        }))
      const itemsTotal = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0)
      return {
        id: o.id,
        status: meta.status ?? o.status,
        created_at: meta.created_at ?? o.created_at,
        total: itemsTotal,
        email: meta.email ?? o.email,
        items,
      }
    })

  res.json({ orders: vendorOrders })
}
