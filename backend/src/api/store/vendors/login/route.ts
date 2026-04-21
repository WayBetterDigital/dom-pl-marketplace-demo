import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { VENDOR_MODULE } from "../../../../modules/vendor"
import VendorModuleService from "../../../../modules/vendor/service"
import {
  toVendorAuthResponse,
  verifyPassword,
  signVendorToken,
} from "../../../shared/vendor"
import { VendorLoginSchema } from "./validators"

export async function POST(
  req: MedusaRequest<VendorLoginSchema>,
  res: MedusaResponse
) {
  const { email, password } = req.validatedBody

  const vendorService: VendorModuleService = req.scope.resolve(VENDOR_MODULE)
  const [vendor] = await vendorService.listVendors({ email })

  if (!vendor || !vendor.password_hash || !verifyPassword(password, vendor.password_hash)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło")
  }

  const vendorResponse = toVendorAuthResponse(vendor)

  res.json({ vendor: vendorResponse, token: signVendorToken(vendorResponse) })
}
