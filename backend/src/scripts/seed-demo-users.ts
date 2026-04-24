import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import scryptKdf from "scrypt-kdf"
import { VENDOR_MODULE } from "../modules/vendor"
import VendorModuleService from "../modules/vendor/service"
import { HOUSE_PLAN_MODULE } from "../modules/house_plan"
import HousePlanModuleService from "../modules/house_plan/service"
import { hashPassword } from "../api/shared/vendor"

const DEMO_VENDOR = {
  company_name: "Demo Projekty Sp. z o.o.",
  first_name: "Jan",
  last_name: "Kowalski",
  email: "jkowalski@gmail.com",
  password: "ZAQ!2wsx",
}

const DEMO_CUSTOMER = {
  first_name: "Anna",
  last_name: "Nowak",
  email: "anowak@gmail.com",
  password: "ZAQ!2wsx",
}

// Hash password the same way Medusa's emailpass provider does
async function hashEmailpassPassword(password: string): Promise<string> {
  const hash = await scryptKdf.kdf(password, { logN: 15, r: 8, p: 1 })
  return hash.toString("base64")
}

export default async function seedDemoUsers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const vendorService: VendorModuleService = container.resolve(VENDOR_MODULE)
  const housePlanService: HousePlanModuleService = container.resolve(HOUSE_PLAN_MODULE)
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const authModuleService = container.resolve(Modules.AUTH)

  // --- Demo Vendor ---
  logger.info("Seeding demo vendor...")

  const [existingVendor] = await vendorService.listVendors({ email: DEMO_VENDOR.email })

  let vendorId: string

  if (existingVendor) {
    vendorId = existingVendor.id
    await vendorService.updateVendors({ id: vendorId }, { password_hash: hashPassword(DEMO_VENDOR.password) })
    logger.info(`Demo vendor already exists (${vendorId}), updated password hash.`)
  } else {
    const vendor = await vendorService.createVendors({
      company_name: DEMO_VENDOR.company_name,
      first_name: DEMO_VENDOR.first_name,
      last_name: DEMO_VENDOR.last_name,
      email: DEMO_VENDOR.email,
      password_hash: hashPassword(DEMO_VENDOR.password),
    })
    vendorId = vendor.id
    logger.info(`Created demo vendor: ${vendorId}`)
  }

  // Link all existing house plans to the demo vendor
  const housePlans = await housePlanService.listHousePlans()

  if (housePlans.length === 0) {
    logger.info("No house plans found to link. Run the house plan seeder first.")
  } else {
    for (const plan of housePlans) {
      try {
        await link.create({
          [VENDOR_MODULE]: { vendor_id: vendorId },
          [HOUSE_PLAN_MODULE]: { house_plan_id: plan.id },
        })
      } catch {
        // Link may already exist — ignore
      }
    }
    logger.info(`Linked ${housePlans.length} house plans to demo vendor.`)
  }

  // --- Demo Customer ---
  logger.info("Seeding demo customer...")

  const passwordHash = await hashEmailpassPassword(DEMO_CUSTOMER.password)

  // Check if auth identity already exists — delete and recreate with correct hash
  const existingIdentities = await authModuleService.listAuthIdentities(
    { provider_identities: { entity_id: DEMO_CUSTOMER.email, provider: "emailpass" } } as any
  )

  if (existingIdentities.length > 0) {
    await authModuleService.deleteAuthIdentities(existingIdentities.map((i: any) => i.id))
    logger.info("Deleted stale demo customer auth identity.")
  }

  const existingCustomers = await customerModuleService.listCustomers({
    email: DEMO_CUSTOMER.email,
  })

  let customerId: string

  if (existingCustomers.length > 0) {
    customerId = existingCustomers[0].id
    logger.info(`Demo customer already exists (${customerId}), recreating auth identity.`)
  } else {
    const [customer] = await customerModuleService.createCustomers([
      {
        first_name: DEMO_CUSTOMER.first_name,
        last_name: DEMO_CUSTOMER.last_name,
        email: DEMO_CUSTOMER.email,
      },
    ])
    customerId = customer.id
    logger.info(`Created demo customer: ${customerId}`)
  }

  await authModuleService.createAuthIdentities([
    {
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: DEMO_CUSTOMER.email,
          provider_metadata: {
            password: passwordHash,
          },
        },
      ],
      app_metadata: {
        customer_id: customerId,
      },
    },
  ])

  logger.info("Demo users seeding complete.")
}
