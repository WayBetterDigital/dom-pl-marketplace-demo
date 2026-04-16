import { model } from "@medusajs/framework/utils"

const HousePlanFile = model.define("house_plan_file", {
  id: model.id().primaryKey(),
  house_plan_id: model.text(),
  url: model.text(),
  name: model.text(),
  mime_type: model.text(),
  size: model.number().default(0),
  sort_order: model.number().default(0),
})

export default HousePlanFile
