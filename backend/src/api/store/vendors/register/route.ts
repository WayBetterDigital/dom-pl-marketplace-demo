import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
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

  const [existingEmail] = await vendorService.listVendors({ email })
  if (existingEmail) {
    return res.status(409).json({ message: "Konto z tym adresem e-mail już istnieje" })
  }

  const [existingCompany] = await vendorService.listVendors({ company_name })
  if (existingCompany) {
    return res.status(409).json({ message: "Firma o tej nazwie jest już zarejestrowana" })
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
