<script lang="ts" setup>
const categories = [
  {
    key: 'single-family',
    label: 'Jednorodzinnych',
    img: '/imgs/categories/single-family-houses.png',
    to: ''
  },
  {
    key: 'wooden',
    label: 'drewnianych',
    img: '/imgs/categories/wooden-houses.png',
    to: ''
  },
  {
    key: 'garage',
    label: 'z garażem',
    img: '/imgs/categories/garage-houses.png',
    to: ''
  },
  {
    key: 'no-garage',
    label: 'bez garażu',
    img: '/imgs/categories/no-garage-houses.jpg',
    to: ''
  },
  {
    key: 'multifamily',
    label: 'wielorodzinnych',
    img: '/imgs/categories/multifamily-houses.png',
    to: ''
  },
  {
    key: 'two-room',
    label: '2 - pokojowych',
    img: '/imgs/categories/two-room-houses.jpg',
    to: ''
  }
]

const track = ref<HTMLElement | null>(null)

function scroll(direction: -1 | 1) {
  const el = track.value
  if (!el) return

  const max = el.scrollWidth - el.clientWidth
  const atEnd = el.scrollLeft >= max - 4
  const atStart = el.scrollLeft <= 4

  if (direction === 1 && atEnd) {
    el.scrollTo({ left: 0, behavior: 'smooth' })
  } else if (direction === -1 && atStart) {
    el.scrollTo({ left: max, behavior: 'smooth' })
  } else {
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }
}
</script>

<template>
  <section class="relative px-4 md:px-16 py-10 pt-0">
    <button
      type="button"
      aria-label="Poprzednie"
      class="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-[10px] border border-brand-blue-700/15 bg-white text-brand-blue-700 shadow-sm hover:bg-brand-blue-700/80 hover:text-white cursor-pointer"
      @click="scroll(-1)"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-5"
      />
    </button>

    <div
      ref="track"
      class="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <NuxtLink
        v-for="category in categories"
        :key="category.key"
        :to="category.to"
        class="group snap-start shrink-0 w-40 md:w-[204px] rounded-[10px] border border-brand-blue-700/10 bg-white py-3 px-4 transition hover:ring-2 hover:ring-brand-blue-400"
      >
        <div class="overflow-hidden mb-4 bg-white">
          <NuxtImg
            :src="category.img"
            :alt="`Projekty domów ${category.label}`"
            class="w-full h-28 object-cover"
          />
        </div>
        <p
          class="text-center text-sm font-semibold text-brand-blue-700 leading-5 pb-2"
        >
          <span class="block">Projekty domów</span>
          <span class="block">{{ category.label }}</span>
        </p>
      </NuxtLink>
    </div>

    <button
      type="button"
      aria-label="Następne"
      class="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-[10px] border border-brand-blue-700/15 bg-white text-brand-blue-700 shadow-sm hover:bg-brand-blue-700/80 hover:text-white cursor-pointer"
      @click="scroll(1)"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-5"
      />
    </button>
  </section>
</template>
