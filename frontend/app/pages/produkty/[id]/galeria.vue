<script setup lang="ts">
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'

const route = useRoute()
const id = route.params.id as string

const housePlanService = useHousePlanService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Projekt nie znaleziony',
    fatal: true
  })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Back Button -->
    <div class="mb-4">
      <UButton
        to="/produkty"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do projektów
      </UButton>
    </div>

    <!-- Tab navigation -->
    <PlanTabNav :plan-id="id" class="mb-8" />

    <!-- Plan title -->
    <h1 class="text-2xl font-bold text-default mb-8">
      {{ plan?.title }} — Galeria
    </h1>

    <!-- Placeholder — zdjęcia zostaną dodane -->
    <div class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
      <UIcon name="i-lucide-images" class="size-12 text-muted" />
      <p class="text-muted text-sm">
        Galeria wizualizacji zostanie dodana wkrótce.
      </p>
    </div>
  </div>
</template>
