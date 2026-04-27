import { MedusaService } from "@medusajs/framework/utils"
import HousePlan from "./models/house_plan"
import HousePlanSketch from "./models/house_plan_sketch"
import HousePlanFile from "./models/house_plan_file"

class HousePlanModuleService extends MedusaService({
  HousePlan,
  HousePlanSketch,
  HousePlanFile,
}) {}

export default HousePlanModuleService
