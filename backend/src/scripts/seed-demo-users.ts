import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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

export default async function seedDemoUsers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const vendorService: VendorModuleService = container.resolve(VENDOR_MODULE)
  const housePlanService: HousePlanModuleService = container.resolve(HOUSE_PLAN_MODULE)
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const authModuleService = container.resolve(Modules.AUTH)

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

  logger.info("Seeding demo customer...")

  const existingCustomers = await customerModuleService.listCustomers({
    email: DEMO_CUSTOMER.email,
  })

  if (existingCustomers.length > 0) {
    logger.info("Demo customer already exists, skipping creation.")
  } else {
    const [customer] = await customerModuleService.createCustomers([
      {
        first_name: DEMO_CUSTOMER.first_name,
        last_name: DEMO_CUSTOMER.last_name,
        email: DEMO_CUSTOMER.email,
      },
    ])

    await authModuleService.createAuthIdentities([
      {
        provider_identities: [
          {
            provider: "emailpass",
            entity_id: DEMO_CUSTOMER.email,
            provider_metadata: {
              password: DEMO_CUSTOMER.password,
            },
          },
        ],
        app_metadata: {
          customer_id: customer.id,
        },
      },
    ])

    logger.info(`Created demo customer: ${customer.id}`)
  }

  logger.info("Demo users seeding complete.")
}
