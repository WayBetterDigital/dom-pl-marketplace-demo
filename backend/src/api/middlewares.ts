import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import multer from "multer"
import { FILE_LIMITS, BODY_LIMITS } from "../lib/file-limits"
import { CreateHousePlanSchema, UpdateHousePlanSchema } from "./admin/house-plans/validators"
import { CreateVendorSchema, UpdateVendorSchema } from "./admin/vendors/validators"
import {
  CreateVendorHousePlanSchema,
  UpdateVendorHousePlanSchema,
} from "./store/vendors/[id]/house-plans/validators"
import {
  CreateGalleryImageSchema,
  UpdateGalleryImageSchema,
} from "./store/vendors/[id]/house-plans/[planId]/gallery/validators"
import { VendorLoginSchema } from "./store/vendors/login/validators"
import { VendorRegisterSchema } from "./store/vendors/register/validators"
import { requireVendorOwnership } from "./store/vendors/requireVendorOwnership"

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_LIMITS.gallery },
})

const sketchUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_LIMITS.sketches },
})

const planFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_LIMITS.planFiles },
})

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
      matcher: "/store/customers/:id/orders",
      method: "GET",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/vendors/:id/orders",
      method: "GET",
      middlewares: [requireVendorOwnership],
    },
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
      middlewares: [requireVendorOwnership, validateAndTransformBody(CreateVendorHousePlanSchema)],
    },
    {
      matcher: "/store/vendors/:id/house-plans",
      method: "DELETE",
      middlewares: [requireVendorOwnership],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId",
      method: "POST",
      middlewares: [requireVendorOwnership, validateAndTransformBody(UpdateVendorHousePlanSchema)],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId",
      method: "DELETE",
      middlewares: [requireVendorOwnership],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId/images",
      method: "POST",
      middlewares: [requireVendorOwnership],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId/images",
      method: "DELETE",
      middlewares: [requireVendorOwnership],
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
      matcher: "/store/vendors/login",
      method: "POST",
      middlewares: [validateAndTransformBody(VendorLoginSchema)],
    },
    {
      matcher: "/store/vendors/register",
      method: "POST",
      middlewares: [validateAndTransformBody(VendorRegisterSchema)],
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
    {
      matcher: "/store/vendors/:id/house-plans/:planId/gallery",
      method: "POST",
      bodyParser: { sizeLimit: BODY_LIMITS.gallery },
      middlewares: [requireVendorOwnership, validateAndTransformBody(CreateGalleryImageSchema)],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId/gallery/:imageId",
      method: "POST",
      middlewares: [requireVendorOwnership, validateAndTransformBody(UpdateGalleryImageSchema)],
    },
    {
      matcher: "/store/vendors/:id/house-plans/:planId/gallery/:imageId",
      method: "DELETE",
      middlewares: [requireVendorOwnership],
    },
    // Multipart uploads — bodyParser disabled, multer enforces per-type size limits
    {
      matcher: "/store/house-plans/:id/files",
      method: "POST",
      bodyParser: false,
      middlewares: [planFileUpload.single("file")],
    },
    {
      matcher: "/store/house-plans/:id/sketches",
      method: "POST",
      bodyParser: false,
      middlewares: [sketchUpload.single("file")],
    },
    {
      matcher: "/store/house-plans/:id/sketches/:sketchId",
      method: "POST",
      bodyParser: false,
      middlewares: [sketchUpload.single("file")],
    },
    {
      matcher: "/admin/products/:id/files",
      method: "POST",
      bodyParser: false,
      middlewares: [planFileUpload.single("file")],
    },
    {
      matcher: "/admin/house-plans/:id/files",
      method: "POST",
      bodyParser: { sizeLimit: BODY_LIMITS.planFiles },
    },
    {
      matcher: "/admin/products/:id/sketches",
      method: "POST",
      bodyParser: { sizeLimit: BODY_LIMITS.sketches },
    },
  ],
})
