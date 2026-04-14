import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { CreateHousePlanSchema, UpdateHousePlanSchema } from "./admin/house-plans/validators"
import { CreateVendorSchema, UpdateVendorSchema } from "./admin/vendors/validators"
import { CreateVendorHousePlanSchema } from "./store/vendors/[id]/house-plans/validators"

const HousePlanAdditionalDataSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  house_area: z.number().positive(),
  boiler_room_area: z.number().positive().optional(),
  rooms: z.number().int().positive(),
  bathrooms_and_wc: z.number().int().positive(),
  plot_dimensions: z.string().min(1),
  min_plot_dimensions_after_adaptation: z.string().optional(),
})

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/admin/products",
      additionalDataValidator: {
        house_plan: HousePlanAdditionalDataSchema.optional(),
      },
    },
    {
      method: "POST",
      matcher: "/admin/products/:id",
      additionalDataValidator: {
        house_plan: HousePlanAdditionalDataSchema.partial().nullish(),
      },
    },
    {
      matcher: "/store/vendors/:id/house-plans",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateVendorHousePlanSchema)],
    },
    {
      matcher: "/admin/house-plans",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateHousePlanSchema)],
    },
    {
      matcher: "/admin/house-plans/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateHousePlanSchema)],
    },
    {
      matcher: "/admin/vendors",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateVendorSchema)],
    },
    {
      matcher: "/admin/vendors/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateVendorSchema)],
    },
  ],
})
