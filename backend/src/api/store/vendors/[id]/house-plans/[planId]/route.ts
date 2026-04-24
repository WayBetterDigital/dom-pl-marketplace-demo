import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteProductsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { HOUSE_PLAN_MODULE } from "../../../../../../modules/house_plan"
import { VENDOR_MODULE } from "../../../../../../modules/vendor"
import HousePlanModuleService from "../../../../../../modules/house_plan/service"
import { HOUSE_PLAN_FIELDS } from "../../../../../../modules/house_plan/fields"
import type { UpdateVendorHousePlanSchema } from "../validators"

type VendorPlanUpdateBody = Omit<UpdateVendorHousePlanSchema, "price"> & { price?: number }

export async function POST(
  req: MedusaRequest<VendorPlanUpdateBody>,
  res: MedusaResponse
) {
  const { id: vendorId, planId } = req.params
  const body = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const housePlanService: HousePlanModuleService = req.scope.resolve(HOUSE_PLAN_MODULE)

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "house_plans.id",
      "house_plans.product.id",
      "house_plans.product.variants.id",
    ],
    filters: { id: vendorId },
  })

  const targetPlan = vendors[0]?.house_plans?.find((plan: any) => plan.id === planId)
  if (!targetPlan) {
    return res.status(404).json({ message: "Plan nie istnieje lub nie należy do sprzedawcy." })
  }

  const productId = targetPlan.product?.id as string | undefined
  const variantId = targetPlan.product?.variants?.[0]?.id as string | undefined

  if (productId && body.title) {
    await updateProductsWorkflow(req.scope).run({
      input: {
        products: [{ id: productId, title: body.title }],
      },
    })
  }

  if (variantId && body.price !== undefined) {
    await updateProductVariantsWorkflow(req.scope).run({
      input: {
        product_variants: [
          {
            id: variantId,
            prices: [{ currency_code: "pln", amount: body.price }],
          },
        ],
      },
    })
  }

  const house_plan = await housePlanService.updateHousePlans({
    id: planId,
    ...body,
  })

  const { data: refreshed } = await query.graph({
    entity: "house_plan",
    fields: [
      ...HOUSE_PLAN_FIELDS,
      "product.id",
      "product.thumbnail",
      "product.images.id",
      "product.images.url",
      "vendor.id",
      "vendor.company_name",
      "vendor.first_name",
      "vendor.last_name",
      "vendor.email",
      "vendor.average_rating",
      "vendor.house_plans_count",
    ],
    filters: { id: house_plan.id },
  })

  res.json({ house_plan: refreshed[0] ?? house_plan })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: vendorId, planId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const housePlanService: HousePlanModuleService = req.scope.resolve(HOUSE_PLAN_MODULE)

  // Find the linked Medusa product via reverse traversal
  const { data: housePlans } = await query.graph({
    entity: "house_plan",
    fields: ["id", "product.id"],
    filters: { id: planId },
  })
  const productId = (housePlans[0]?.product as any)?.id

  // Dismiss vendor↔house_plan link FIRST — prevents orphaned link entries
  // that would cause the vendor house plans query to fail
  await link.dismiss({
    [VENDOR_MODULE]: { vendor_id: vendorId },
    [HOUSE_PLAN_MODULE]: { house_plan_id: planId },
  })

  // Delete house plan
  await housePlanService.deleteHousePlans(planId)

  // Delete the linked Medusa product if found (cascades variants + product↔house_plan link)
  if (productId) {
    await deleteProductsWorkflow(req.scope).run({
      input: { ids: [productId] },
    })
  }

  res.json({ id: planId, deleted: true })
}
