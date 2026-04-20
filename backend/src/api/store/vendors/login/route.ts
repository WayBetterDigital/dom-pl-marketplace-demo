import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { VENDOR_MODULE } from "../../../../modules/vendor"
import VendorModuleService from "../../../../modules/vendor/service"
import * as crypto from "crypto"
import * as jwt from "jsonwebtoken"
import { VendorLoginSchema } from "./validators"

export async function POST(
  req: MedusaRequest<VendorLoginSchema>,
  res: MedusaResponse
) {
  const { email, password } = req.validatedBody

  const vendorService: VendorModuleService = req.scope.resolve(VENDOR_MODULE)

  const [vendor] = await vendorService.listVendors({ email })

  if (!vendor || !vendor.password_hash) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło")
  }

  const [salt, storedHash] = vendor.password_hash.split(":")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")

  if (hash !== storedHash) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło")
  }

  const secret = process.env.JWT_SECRET || "supersecret"
  const token = jwt.sign(
    { vendor_id: vendor.id, email: vendor.email, type: "vendor" },
    secret,
    { expiresIn: "7d" }
  )

  res.json({
    vendor: {
      id: vendor.id,
      email: vendor.email,
      first_name: vendor.first_name,
      last_name: vendor.last_name,
      company_name: vendor.company_name,
    },
    token,
  })
}
