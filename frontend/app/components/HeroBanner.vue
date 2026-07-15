<script lang="ts" setup>
withDefaults(
  defineProps<{
    plansCount?: number
  }>(),
  { plansCount: 3421 }
)

const quickFilters = [
  { key: 'area', label: 'Powierzchnia', icon: 'i-local-area-icon', selected: 1 },
  { key: 'floors', label: 'Kondygnacje', icon: 'i-local-floors-icon', selected: 0 },
  { key: 'rooms', label: 'Pokoje', icon: 'i-local-door-icon', selected: 0 }
]

const guarantees = [
  {
    icon: 'i-local-warranty-shield',
    label: 'Gwarancja bezbłędności i zgodności prawnej'
  },
  {
    icon: 'i-local-architect-frame',
    label: 'Tylko zweryfikowani architekci'
  },
  {
    icon: 'i-local-cashback',
    label: 'Bezpieczeństwo i gwarancja zwrotu'
  }
]
</script>

<template>
  <section class="px-4 md:px-[137px] pt-5 mb-20">
    <div
      class="relative overflow-hidden rounded-[40px] bg-brand-blue-700 text-white min-h-75"
    >
      <NuxtImg
        src="/imgs/main-house-img.png"
        alt=""
        class="absolute inset-0 size-full object-cover object-left"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-brand-blue-700 from-0% via-brand-blue-700/80 to-transparent"
        aria-hidden="true"
      />

      <NuxtImg
        src="/svgs/house-heart.svg"
        alt=""
        class="hidden xl:block absolute right-10 top-1/2 -translate-y-1/2 w-[127px]"
        aria-hidden="true"
      />

      <div class="relative pl-15 pr-10 pt-20 pb-[32px]">
        <h1 class="text-[28px] mb-8 leading-9">
          <span class="block font-bold mb-2">Gotowe projekty domów</span>
          <span class="block font-light">na wyciągnięcie ręki!</span>
        </h1>

        <div
          class="flex flex-wrap xl:flex-nowrap xl:w-fit items-center gap-3 mb-8 rounded-[10px] bg-white/10 p-[5px]"
        >
          <div
            class="flex items-center rounded-[10px] bg-white text-brand-blue-700 px-2 py-1.5"
          >
            <button
              v-for="(filter, index) in quickFilters"
              :key="filter.key"
              type="button"
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap cursor-pointer"
              :class="index > 0 ? 'border-l border-brand-blue-700/15' : ''"
            >
              <UIcon :name="filter.icon" class="size-5 shrink-0" />
              {{ filter.label }}
              <UBadge
                v-if="filter.selected"
                :label="String(filter.selected)"
                :ui="{
                  base: 'size-5 shrink-0 p-0 flex items-center justify-center rounded-full bg-brand-crimson-700 text-white text-[11px] font-semibold leading-none'
                }"
              />
            </button>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 mx-2 shrink-0 text-brand-blue-700/60"
            />
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-[10px] px-4 py-2.5 text-sm text-white border border-white/70 bg-transparent hover:bg-white/10 whitespace-nowrap"
            >
              <UIcon name="i-local-filter" class="size-5" />
              Wszystkie filtry
            </UButton>
            <UButton
              to="/produkty"
              class="rounded-[10px] px-5 py-2.5 text-sm bg-brand-green-500 text-white font-semibold hover:bg-brand-green-500/90 whitespace-nowrap"
            >
              Pokaż {{ plansCount }} projekty domów
            </UButton>
          </div>
        </div>

        <ul class="flex flex-wrap items-center gap-x-8 gap-y-3">
          <li
            v-for="guarantee in guarantees"
            :key="guarantee.label"
            class="flex items-center gap-2 text-sm font-semibold leading-6"
          >
            <UIcon
              :name="guarantee.icon"
              class="size-6 shrink-0 text-brand-green-500"
            />
            {{ guarantee.label }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
