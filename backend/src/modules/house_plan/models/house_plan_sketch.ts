import { model } from "@medusajs/framework/utils"

// 0 = rzut, 1 = rzut z opisami pomieszczeń
const HousePlanSketch = model.define("house_plan_sketch", {
  id: model.id().primaryKey(),
  house_plan_id: model.text(),
  url: model.text(),
  floor: model.number().default(0),
  type: model.number().default(0),
  sort_order: model.number().default(0),
})

export default HousePlanSketch
