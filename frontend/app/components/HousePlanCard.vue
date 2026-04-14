<script setup lang="ts">
import type { AppHousePlan } from '~/types/house-plan'

defineProps<{
  plan: AppHousePlan
}>()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(price)
}
</script>

<template>
  <UCard :ui="{ body: 'p-0', footer: 'p-4' }">
    <!-- Image Carousel -->
    <div class="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-t-lg overflow-hidden">
      <PlanImageGallery
        :images="plan?.images"
        :thumbnail="plan?.thumbnail"
        mode="compact"
      />
    </div>
    <!-- Content -->
    <div class="p-4 space-y-4">
      <div>
        <h3 class="text-lg font-semibold truncate" :title="plan.title">
          {{ plan.title }}
        </h3>
        <div
          v-if="plan.family"
          class="flex items-center gap-1 mb-1"
        >
          <UIcon name="i-lucide-layers-2" class="size-3.5 text-muted shrink-0" />
          <span class="text-xs text-muted truncate">
            {{ plan.family.name }}
          </span>
        </div>
        <div
          v-else
          class="text-xs"
        >
          &nbsp;
        </div>
        <p class="text-xl font-bold text-primary mt-1">
          {{ formatPrice(plan.price) }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-maximize" class="size-4" />
          <span>{{ plan.houseArea }} m²</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-door-open" class="size-4" />
          <span>{{ plan.rooms }} pokoje</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-bath" class="size-4" />
          <span>{{ plan.bathroomsAndWc }} łazienki</span>
        </div>
        <div v-if="plan.floors" class="flex items-center gap-1.5">
          <UIcon name="i-lucide-layers" class="size-5" />
          <span>{{ plan.floors }} {{ plan.floors === 1 ? 'kondygnacja' : 'kondygnacje' }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <UButton
        block
        color="neutral"
        variant="subtle"
        :to="`/produkty/${plan.id}`"
      >
        Zobacz szczegóły
      </UButton>
    </template>
  </UCard>
</template>
