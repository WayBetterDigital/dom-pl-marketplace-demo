import { model } from "@medusajs/framework/utils"
import PlanFamily from "./plan_family"

const HousePlan = model.define("house_plan", {
  id: model.id().primaryKey(),
  title: model.text(),
  price: model.bigNumber(),
  description: model.text().nullable(),
  house_area: model.number(),
  boiler_room_area: model.number().nullable(),
  rooms: model.number(),
  bathrooms_and_wc: model.number(),
  plot_dimensions: model.text(),
  min_plot_dimensions_after_adaptation: model.text().nullable(),
  floors: model.number(),
  building_width: model.number().nullable(),
  building_length: model.number().nullable(),
  building_footprint: model.number().nullable(),
  total_area: model.number().nullable(),
  roof_type: model.text().nullable(),
  roof_angle: model.number().nullable(),
  garage: model.text().nullable(),
  architectural_style: model.text().nullable(),
  energy_standard: model.text().nullable(),
  basement: model.text().nullable(),
  building_height: model.number().nullable(),
  fireplace: model.boolean().nullable(),
  terrace: model.boolean().nullable(),
  house_type: model.text().nullable(),
  family: model.belongsTo(() => PlanFamily, {
    mappedBy: "house_plans",
  }).nullable(),
})

export default HousePlan
