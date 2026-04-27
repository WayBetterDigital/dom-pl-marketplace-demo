<script setup lang="ts">
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import {
  useFileService,
  formatFileSize,
  fileIcon,
  fileIconColor
} from '~/composables/services/useFileService'

const route = useRoute()
const id = route.params.id as string

const housePlanService = useHousePlanService()
const { getFiles } = useFileService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

const { data: files } = await useAsyncData(
  `plan-files-${id}`,
  () => getFiles(id)
)

async function handleDownload(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
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
    <PlanTabNav
      :plan-id="id"
      class="mb-8"
    />

    <!-- Title -->
    <h1 class="text-2xl font-bold text-default mb-6">
      {{ plan?.title }}
    </h1>

    <!-- Empty state -->
    <div
      v-if="!files?.length"
      class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="size-12 text-muted"
      />
      <p class="text-default font-medium">
        Brak plików
      </p>
    </div>

    <!-- File list -->
    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="group flex items-center gap-4 px-4 py-3 rounded-xl border border-default hover:bg-muted/50 transition-colors"
      >
        <UIcon
          :name="fileIcon(file.mime_type)"
          :class="['size-8 shrink-0', fileIconColor(file.mime_type)]"
        />

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-default truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-muted">
            {{ formatFileSize(file.size) }}
          </p>
        </div>

        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
          <UButton
            icon="i-lucide-download"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Pobierz"
            class="cursor-pointer"
            @click="handleDownload(file.url, file.name)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
