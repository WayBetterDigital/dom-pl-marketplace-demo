import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { VENDOR_MODULE } from "../../../../modules/vendor"
import VendorModuleService from "../../../../modules/vendor/service"
import {
  toVendorAuthResponse,
  hashPassword,
  signVendorToken,
} from "../../../shared/vendor"
import { VendorRegisterSchema } from "./validators"

export async function POST(
  req: MedusaRequest<VendorRegisterSchema>,
  res: MedusaResponse
) {
  const { company_name, first_name, last_name, email, password } = req.validatedBody

  const vendorService: VendorModuleService = req.scope.resolve(VENDOR_MODULE)

  const [existing] = await vendorService.listVendors({ email })
  if (existing) {
    throw new MedusaError(MedusaError.Types.CONFLICT, "Konto z tym adresem e-mail już istnieje")
  }

  const vendor = await vendorService.createVendors({
    company_name,
    first_name,
    last_name,
    email,
    password_hash: hashPassword(password),
  })

  const vendorResponse = toVendorAuthResponse(vendor)

  res.status(201).json({ vendor: vendorResponse, token: signVendorToken(vendorResponse) })
}
