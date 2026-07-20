<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  title?: string
}>()

defineSlots<{
  default: (props: { item: T, index: number }) => unknown
}>()

const track = ref<HTMLElement | null>(null)

function keyOf(item: T, index: number): string | number {
  const record = item as Record<string, unknown>
  return (record?.id as string) ?? (record?.key as string) ?? index
}

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
  <section class="py-10">
    <h2
      v-if="title"
      class="text-[24px] leading-10 font-bold text-brand-blue-700 mb-6"
    >
      {{ title }}
    </h2>

    <div class="relative">
      <button
        type="button"
        aria-label="Poprzednie"
        class="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-[4px] border border-brand-blue-700/15 bg-white text-brand-blue-700 shadow-sm hover:bg-brand-blue-700/80 hover:text-white cursor-pointer"
        @click="scroll(-1)"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="size-5"
        />
      </button>

      <div
        ref="track"
        class="carousel-track flex gap-5 overflow-x-auto thin-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        <template
          v-for="(item, index) in items"
          :key="keyOf(item, index)"
        >
          <slot
            :item="item"
            :index="index"
          />
        </template>
      </div>

      <button
        type="button"
        aria-label="Następne"
        class="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-[4px] border border-brand-blue-700/15 bg-white text-brand-blue-700 shadow-sm hover:bg-brand-blue-700/80 hover:text-white cursor-pointer"
        @click="scroll(1)"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-5"
        />
      </button>
    </div>
  </section>
</template>

<style scoped>
.carousel-track > :slotted(*) {
  scroll-snap-align: start;
}

@media (min-width: 768px) {
  .carousel-track {
    scrollbar-width: none;
  }
  .carousel-track::-webkit-scrollbar {
    display: none;
  }
}
</style>
