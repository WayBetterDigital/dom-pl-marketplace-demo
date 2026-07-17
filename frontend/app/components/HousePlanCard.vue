<script setup lang="ts">
import type { AppHousePlan } from '~/types/house-plan'

withDefaults(
  defineProps<{
    plan: AppHousePlan
    hotPromo?: boolean
  }>(),
  { hotPromo: false }
)

const isFavorite = ref(false)

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
    useGrouping: 'always'
  }).format(price)
}

const plural = (n: number, one: string, few: string, many: string) => {
  if (n === 1) return one
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few
  return many
}
</script>

<template>
  <div
    class="flex flex-col overflow-hidden rounded-xl border border-brand-blue-700/10 bg-white"
  >
    <div class="relative">
      <div class="aspect-video overflow-hidden bg-neutral-100">
        <PlanImageGallery
          :images="plan?.images"
          :thumbnail="plan?.thumbnail"
          mode="compact"
        />
      </div>

      <span
        v-if="hotPromo"
        class="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-brand-green-500 px-2 py-1 text-[10px] font-semibold text-white"
      >
        <NuxtImg
          src="/svgs/hot-promo.svg"
          alt=""
          class="w-3 h-3"
          aria-hidden="true"
        />
        Hot promo
      </span>

      <button
        type="button"
        :aria-label="isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'"
        class="absolute top-3 right-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm hover:bg-brand-blue-700/5"
        @click="isFavorite = !isFavorite"
      >
        <UIcon
          name="i-lucide-heart"
          class="size-4"
          :class="
            isFavorite
              ? 'text-brand-crimson-700 fill-brand-crimson-700'
              : 'text-brand-blue-700'
          "
        />
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h3
          class="truncate text-[13px] font-semibold text-brand-blue-700"
          :title="plan.title"
        >
          {{ plan.title }}
        </h3>
        <p class="mt-1 text-sm font-bold text-brand-green-500">
          {{ formatPrice(plan.price) }}
        </p>
      </div>

      <div
        class="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] font-medium text-brand-blue-700"
      >
        <span class="flex items-center gap-1.5">
          <UIcon
            name="i-local-area-icon"
            class="size-4 shrink-0"
          />
          {{ plan.houseArea }} m²
        </span>
        <span class="flex items-center gap-1.5">
          <UIcon
            name="i-local-door-icon"
            class="size-4 shrink-0"
          />
          {{ plan.rooms }} {{ plural(plan.rooms, 'pokój', 'pokoje', 'pokoi') }}
        </span>
        <span class="flex items-center gap-1.5">
          <UIcon
            name="i-lucide-bath"
            class="size-4 shrink-0"
          />
          {{ plan.bathroomsAndWc }}
          {{ plural(plan.bathroomsAndWc, 'łazienka', 'łazienki', 'łazienek') }}
        </span>
        <span
          v-if="plan.floors"
          class="flex items-center gap-1.5"
        >
          <UIcon
            name="i-local-floors-icon"
            class="size-4 shrink-0"
          />
          {{ plan.floors }}
          {{ plural(plan.floors, 'kondygnacja', 'kondygnacje', 'kondygnacji') }}
        </span>
      </div>

      <UButton
        block
        :to="`/produkty/${plan.id}`"
        class="mt-auto rounded-lg border border-brand-blue-700/15 bg-white py-2 text-[12px] font-semibold text-brand-blue-700 hover:bg-brand-blue-700/5"
      >
        Zobacz szczegóły
      </UButton>
    </div>
  </div>
</template>
