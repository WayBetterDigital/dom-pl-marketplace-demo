import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import { HOUSE_PLAN_MODULE } from "../../../../../modules/house_plan"
import { HOUSE_PLAN_FIELDS } from "../../../../../modules/house_plan/fields"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import HousePlanModuleService from "../../../../../modules/house_plan/service"
import { VENDOR_MODULE } from "../../../../../modules/vendor"
import type { CreateVendorHousePlanSchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      ...HOUSE_PLAN_FIELDS.map(f => `house_plans.${f}`),
      "house_plans.product.id",
      "house_plans.product.thumbnail",
      "house_plans.product.images.id",
      "house_plans.product.images.url",
    ],
    filters: { id },
  })

  res.json({ house_plans: vendors[0]?.house_plans ?? [] })
}

export async function POST(
  req: MedusaRequest<CreateVendorHousePlanSchema>,
  res: MedusaResponse
) {
  const { id: vendorId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const body = req.validatedBody

  // Query for the default sales channel
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  })
  const salesChannelId = salesChannels[0]?.id

  // Create Medusa Product — hook will create house_plan + product↔house_plan link
  const { result: products } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          title: body.title,
          status: ProductStatus.PUBLISHED,
          options: [{ title: "Wersja", values: ["Dokumentacja"] }],
          variants: [
            {
              title: "Dokumentacja",
              options: { Wersja: "Dokumentacja" },
              prices: [{ currency_code: "pln", amount: body.price }],
              manage_inventory: false,
            },
          ],
          ...(salesChannelId ? { sales_channels: [{ id: salesChannelId }] } : {}),
        },
      ],
      additional_data: { house_plan: body },
    },
  })

  const productId = products[0].id

  // Get the house_plan created by the hook
  const { data: linkedProducts } = await query.graph({
    entity: "product",
    fields: ["house_plan.id"],
    filters: { id: productId },
  })

  const housePlanId = (linkedProducts[0]?.house_plan as any)?.id

  if (!housePlanId) {
    return res.status(500).json({ message: "Nie udało się utworzyć planu domu" })
  }

  // Link house_plan to vendor
  await link.create({
    [VENDOR_MODULE]: { vendor_id: vendorId },
    [HOUSE_PLAN_MODULE]: { house_plan_id: housePlanId },
  })

  // Return the created house_plan
  const { data: housePlans } = await query.graph({
    entity: "house_plan",
    fields: [...HOUSE_PLAN_FIELDS],
    filters: { id: housePlanId },
  })

  res.status(201).json({ house_plan: housePlans[0] })
}
