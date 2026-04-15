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
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

const mockFiles = [
  { id: '1', name: 'Projekt architektoniczny.pdf', size: '12.4 MB', type: 'pdf', updatedAt: '2024-11-10' },
  { id: '2', name: 'Projekt konstrukcyjny.pdf', size: '8.7 MB', type: 'pdf', updatedAt: '2024-11-10' },
  { id: '3', name: 'Projekt instalacji elektrycznej.pdf', size: '4.2 MB', type: 'pdf', updatedAt: '2024-11-12' },
  { id: '4', name: 'Projekt instalacji wod-kan.pdf', size: '3.8 MB', type: 'pdf', updatedAt: '2024-11-12' },
  { id: '5', name: 'Specyfikacja materiałów.xlsx', size: '1.1 MB', type: 'xlsx', updatedAt: '2024-11-15' },
  { id: '6', name: 'Wizualizacje 3D.zip', size: '245 MB', type: 'zip', updatedAt: '2024-11-08' },
]

function fileIcon(type: string) {
  if (type === 'pdf') return 'i-lucide-file-text'
  if (type === 'xlsx') return 'i-lucide-file-spreadsheet'
  if (type === 'zip') return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

function fileIconColor(type: string) {
  if (type === 'pdf') return 'text-red-500'
  if (type === 'xlsx') return 'text-green-600'
  if (type === 'zip') return 'text-yellow-500'
  return 'text-muted'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Back button -->
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

    <!-- Tab nav -->
    <PlanTabNav :plan-id="id" class="mb-8" />

    <!-- Title -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-default">
        {{ plan?.title }}
      </h1>
    </div>

    <!-- File list -->
    <div class="flex flex-col gap-2">
      <div
        v-for="file in mockFiles"
        :key="file.id"
        class="flex items-center gap-4 px-4 py-3 rounded-xl border border-default bg-[var(--ui-bg)] hover:bg-muted/50 transition-colors"
      >
        <UIcon
          :name="fileIcon(file.type)"
          :class="['size-8 shrink-0', fileIconColor(file.type)]"
        />

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-default truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-muted">
            {{ file.size }} · {{ file.updatedAt }}
          </p>
        </div>

        <UButton
          icon="i-lucide-lock"
          size="sm"
          color="neutral"
          variant="ghost"
          disabled
          aria-label="Plik zablokowany"
        />
      </div>
    </div>
  </div>
</template>
