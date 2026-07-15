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

const filterGroups = [
  {
    key: 'area',
    label: 'Powierzchnia',
    options: [
      '40 - 70m²',
      '70 - 100m²',
      '100 - 120 m²',
      '120 - 140 m²',
      '140 - 160 m²',
      '160 - 200 m²',
      '200 m² i więcej'
    ]
  },
  {
    key: 'floors',
    label: 'Kondygnacje',
    options: ['Parterowy', 'Piętrowy', 'Trzykondygnacyjny']
  },
  {
    key: 'rooms',
    label: 'Pokoje',
    options: [
      '1 pokojowe',
      '2 pokojowe',
      '3 pokojowe',
      '5 pokojowe',
      '6 pokojowe i więcej'
    ]
  }
]

const selectedFilters = reactive<Record<string, string[]>>({
  area: ['40 - 70m²'],
  floors: [],
  rooms: []
})

function toggleFilter(
  groupKey: string,
  option: string,
  value: boolean | 'indeterminate'
) {
  const arr = selectedFilters[groupKey]
  if (!arr) return
  const idx = arr.indexOf(option)
  if (value === true && idx === -1) {
    arr.push(option)
  } else if (value !== true && idx !== -1) {
    arr.splice(idx, 1)
  }
}

function countFor(groupKey: string) {
  return selectedFilters[groupKey]?.length ?? 0
}

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
    <!-- Desktop / tablet -->
    <div
      class="hidden md:block relative overflow-hidden rounded-[40px] bg-brand-blue-700 text-white min-h-75"
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
          <UPopover
            :content="{ align: 'start', side: 'bottom', sideOffset: 12 }"
            :ui="{ content: 'rounded-2xl shadow-xl bg-white ring-1 ring-black/5' }"
          >
            <div
              class="flex items-center rounded-[10px] bg-white text-brand-blue-700 px-2 py-1.5 cursor-pointer"
            >
              <span
                v-for="(filter, index) in quickFilters"
                :key="filter.key"
                class="flex items-center px-3 py-1.5 gap-1.5 text-[12px] font-semibold whitespace-nowrap leading-6 rounded-[10px] hover:bg-gray-100"
                :class="index > 0 ? 'border-l border-brand-blue-700/15' : ''"
              >
                <UIcon
                  :name="filter.icon"
                  class="size-5 shrink-0"
                />
                {{ filter.label }}
                <UBadge
                  v-if="countFor(filter.key)"
                  :label="String(countFor(filter.key))"
                  :ui="{
                    base: 'w-[13px] h-[13px] shrink-0 p-0 flex items-center justify-center rounded-full bg-brand-crimson-700 text-white text-[8px]'
                  }"
                />
                <UIcon
                  v-if="index === quickFilters.length - 1"
                  name="i-lucide-chevron-down"
                  class="size-5 ml-1 shrink-0 text-brand-blue-700/60"
                />
              </span>
            </div>

            <template #content>
              <div class="w-[720px] max-w-[85vw] p-6">
                <div class="grid grid-cols-3 gap-x-8">
                  <div
                    v-for="group in filterGroups"
                    :key="group.key"
                  >
                    <p class="text-[14px] leading-6 font-semibold text-brand-blue-700 mb-[13px]">
                      {{ group.label }}
                    </p>
                    <div class="flex flex-col gap-1">
                      <UCheckbox
                        v-for="option in group.options"
                        :key="option"
                        :label="option"
                        :model-value="selectedFilters[group.key]?.includes(option)"
                        :ui="{
                          label: 'text-[12px] leading-6 text-brand-blue-700 font-semibold',
                          base: 'ring-brand-blue-700/25',
                          indicator: 'text-white'
                        }"
                        @update:model-value="
                          (v) => toggleFilter(group.key, option, v)
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UPopover>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-[10px] px-4 py-2.5 text-sm text-white border border-white/70 bg-transparent hover:bg-white/10 whitespace-nowrap cursor-pointer"
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

    <!-- Mobile -->
    <div
      class="md:hidden overflow-hidden rounded-3xl border border-white/15 bg-brand-blue-700 text-white"
    >
      <div class="relative">
        <NuxtImg
          src="/imgs/main-house-img.png"
          alt=""
          class="w-full h-52 object-cover"
          aria-hidden="true"
        />
        <div
          class="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-brand-blue-700 to-transparent"
          aria-hidden="true"
        />
        <NuxtImg
          src="/svgs/house-heart.svg"
          alt=""
          class="absolute right-4 bottom-4 w-[72px]"
          aria-hidden="true"
        />
      </div>

      <div class="px-5 pt-6 pb-6">
        <h1 class="text-2xl mb-6 leading-8">
          <span class="block font-bold mb-1">Gotowe projekty domów</span>
          <span class="block font-light">na wyciągnięcie ręki!</span>
        </h1>

        <div class="flex flex-col gap-2 rounded-[10px] bg-white/10 p-[5px] mb-6.5">
          <div
            class="flex items-stretch rounded-[10px] bg-white text-brand-blue-700"
          >
            <template
              v-for="(filter, index) in quickFilters"
              :key="filter.key"
            >
              <div
                v-if="index > 0"
                class="w-px h-[15px] self-center rounded-full bg-black"
                aria-hidden="true"
              />
              <button
                type="button"
                class="flex-1 flex flex-col items-center justify-center py-3 cursor-pointer"
              >
                <span class="relative">
                  <UIcon
                    :name="filter.icon"
                    class="size-5"
                  />
                  <UBadge
                    v-if="filter.selected"
                    :label="String(filter.selected)"
                    :ui="{
                      base: 'absolute -top-2 -right-3 size-4 shrink-0 p-0 flex items-center justify-center rounded-full bg-brand-crimson-700 text-white text-[10px] font-semibold leading-none'
                    }"
                  />
                </span>
                <span class="text-[10px] font-medium">{{ filter.label }}</span>
              </button>
            </template>
            <button
              type="button"
              class="flex items-center justify-center pr-3 pl-1 cursor-pointer"
            >
              <UIcon
                name="i-lucide-chevron-down"
                class="size-5 text-black"
              />
            </button>
          </div>

          <UButton
            to="/produkty"
            block
            class="rounded-[10px] py-3 text-sm bg-brand-green-500 text-white font-semibold hover:bg-brand-green-500/90"
          >
            Pokaż {{ plansCount }} projekty domów
          </UButton>

          <UButton
            color="neutral"
            variant="ghost"
            block
            class="rounded-[10px] py-3 text-sm text-white border border-white bg-transparent hover:bg-white/10"
          >
            <UIcon
              name="i-local-filter"
              class="size-5"
            />
            Wszystkie filtry
          </UButton>
        </div>

        <ul class="flex flex-col gap-6">
          <li
            v-for="guarantee in guarantees"
            :key="guarantee.label"
            class="flex items-center gap-2 text-[12px] font-semibold leading-[21px]"
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
