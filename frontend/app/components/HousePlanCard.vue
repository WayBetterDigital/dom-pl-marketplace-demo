<script setup lang="ts">
import type { AppHousePlan } from '~/types/house-plan'

const props = withDefaults(
  defineProps<{
    plan: AppHousePlan
    hotPromo?: boolean
  }>(),
  { hotPromo: false }
)

const isFavorite = ref(false)

const { formatPrice, formatArea, plural } = useFormat()

const cover = computed(
  () =>
    props.plan.thumbnail
    || props.plan.images?.[0]?.url
    || '/imgs/home_plan1.jpg'
)
</script>

<template>
  <div
    class="flex flex-col rounded-[10px] border border-brand-blue-700/10 bg-white p-2.5 pb-4"
  >
    <div class="relative">
      <div class="aspect-[4/3] overflow-hidden rounded-[10px] bg-neutral-100">
        <NuxtImg
          :src="cover"
          :alt="plan.title"
          class="size-full object-cover"
          loading="lazy"
          @error="($event.target as HTMLImageElement).src = '/imgs/home_plan1.jpg'"
        />
      </div>

      <span
        v-if="hotPromo"
        class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-brand-green-500 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <NuxtImg
          src="/svgs/hot-promo.svg"
          alt=""
          class="w-3.5 h-3.5"
          aria-hidden="true"
        />
        Hot promo
      </span>

      <button
        type="button"
        :aria-label="isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'"
        class="absolute top-1 right-1 flex cursor-pointer items-center justify-center p-[5px] rounded-[4px] border border-brand-blue-700/10 bg-white shadow-sm hover:bg-brand-blue-700/5"
        @click="isFavorite = !isFavorite"
      >
        <NuxtImg
          src="/svgs/heart-outline-black.svg"
          class="size-[14px]"
          :class="
            isFavorite
              ? 'text-brand-crimson-700 fill-brand-crimson-700'
              : 'text-brand-blue-700'
          "
        />
      </button>
    </div>

    <div class="flex flex-1 flex-col px-1 mt-[17px]">
      <h3
        class="truncate text-xl font-bold text-brand-blue-700"
        :title="plan.title"
      >
        {{ plan.title }}
      </h3>
      <p class="text-xl font-bold text-brand-green-500">
        {{ formatPrice(plan.price) }}
      </p>

      <div
        class="mt-3 mb-6 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] leading-6 font-semibold text-brand-blue-700"
      >
        <span class="flex items-center gap-1.5">
          <UIcon
            name="i-local-area-icon"
            class="size-5 shrink-0"
          />
          {{ formatArea(plan.houseArea) }} m²
        </span>
        <span class="flex items-center gap-2">
          <UIcon
            name="i-local-door-icon"
            class="size-5 shrink-0"
          />
          {{ plan.rooms }} {{ plural(plan.rooms, 'pokój', 'pokoje', 'pokoi') }}
        </span>
        <span class="flex items-center gap-2">
          <UIcon
            name="i-lucide-bath"
            class="size-5 shrink-0"
          />
          {{ plan.bathroomsAndWc }}
          {{ plural(plan.bathroomsAndWc, 'łazienka', 'łazienki', 'łazienek') }}
        </span>
        <span
          v-if="plan.floors"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-local-floors-icon"
            class="size-5 shrink-0"
          />
          {{ plan.floors }}
          {{ plural(plan.floors, 'kondygnacja', 'kondygnacje', 'kondygnacji') }}
        </span>
      </div>

      <UButton
        block
        :to="`/produkty/${plan.id}`"
        class="flex mt-auto rounded-xl border border-brand-blue-700/15 bg-white py-2.5 text-[15px] font-semibold text-brand-blue-700 hover:bg-brand-blue-700/5"
      >
        Zobacz szczegóły
      </UButton>
    </div>
  </div>
</template>
