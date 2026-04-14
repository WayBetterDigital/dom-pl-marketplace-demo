import { MedusaService } from "@medusajs/framework/utils"
import HousePlan from "./models/house_plan"
import PlanFamily from "./models/plan_family"
import HousePlanSketch from "./models/house_plan_sketch"

class HousePlanModuleService extends MedusaService({
  HousePlan,
  PlanFamily,
  HousePlanSketch,
}) {}

export default HousePlanModuleService
