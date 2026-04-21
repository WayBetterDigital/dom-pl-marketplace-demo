import { model } from "@medusajs/framework/utils"

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  company_name: model.text().unique(),
  first_name: model.text(),
  last_name: model.text(),
  email: model.text().unique(),
  password_hash: model.text().nullable(),
  revenue: model.bigNumber().default(0),
  average_rating: model.number().nullable(),
})

export default Vendor
