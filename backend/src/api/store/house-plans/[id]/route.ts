import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HOUSE_PLAN_FIELDS } from "../../../../modules/house_plan/fields"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: housePlans } = await query.graph({
    entity: "house_plan",
    fields: [
      ...HOUSE_PLAN_FIELDS,
      "family.id",
      "family.name",
      "vendor.id",
      "vendor.company_name",
      "vendor.first_name",
      "vendor.last_name",
      "vendor.email",
      "vendor.average_rating",
      "vendor.house_plans.id",
      "product.variants.id",
      "product.thumbnail",
      "product.images.id",
      "product.images.url",
    ],
    filters: { id: req.params.id },
  })

  if (!housePlans[0]) {
    return res.status(404).json({ message: "Plan domu nie znaleziony" })
  }

  const housePlan = housePlans[0]
  const vendorRaw = (housePlan as any).vendor
  const vendor = vendorRaw
    ? {
        id: vendorRaw.id,
        company_name: vendorRaw.company_name,
        first_name: vendorRaw.first_name,
        last_name: vendorRaw.last_name,
        email: vendorRaw.email,
        average_rating: vendorRaw.average_rating,
        house_plans_count: vendorRaw.house_plans?.length ?? 0,
      }
    : null

  const variantId = (housePlan as any).product?.variants?.[0]?.id || null

  res.json({ house_plan: { ...housePlan, vendor, variant_id: variantId } })
}