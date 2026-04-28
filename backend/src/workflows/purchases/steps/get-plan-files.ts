import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { HOUSE_PLAN_MODULE } from "../../../modules/house_plan"
import type HousePlanModuleService from "../../../modules/house_plan/service"

export type GetPlanFilesInput = {
  planId: string
}

/**
 * Shape of a plan file as returned by this step.
 * Mirrors HousePlanFile model fields so callers don't depend on ORM types.
 */
export type PlanFile = {
  id: string
  house_plan_id: string
  url: string
  name: string
  mime_type: string
  size: number
  sort_order: number
}

/**
 * Retrieves all files for a given house plan, sorted by sort_order then created_at.
 *
 * This step is intentionally separate from purchase verification so it can be
 * reused independently in future workflows — for example:
 * - ZIP generation (Commit 3)
 * - Email attachment list (future)
 * - Admin file preview (future)
 */
export const getPlanFilesStep = createStep(
  "get-plan-files",
  async ({ planId }: GetPlanFilesInput, { container }) => {
    const housePlanService = container.resolve<HousePlanModuleService>(HOUSE_PLAN_MODULE)

    const files = await housePlanService.listHousePlanFiles(
      { house_plan_id: planId },
      { order: { sort_order: "ASC", created_at: "ASC" } }
    )

    return new StepResponse(files as PlanFile[])
  }
)
