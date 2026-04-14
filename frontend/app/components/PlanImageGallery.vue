<script setup lang="ts">
const props = defineProps<{
  images: { id: string; url: string }[]
  thumbnail?: string | null
  mode?: 'compact' | 'full'
}>()

const mode = computed(() => props.mode ?? 'full')

const allImages = computed(() => {
  const urls: string[] = []
  if (props.thumbnail) urls.push(props.thumbnail)
  for (const img of props.images) {
    if (img.url !== props.thumbnail) urls.push(img.url)
  }
  if (urls.length === 0) urls.push('/imgs/home_plan1.jpg')
  return urls
})

const displayImages = computed(() =>
  mode.value === 'compact' ? allImages.value.slice(0, 4) : allImages.value
)

const hasMultiple = computed(() => displayImages.value.length > 1)

const carouselRef = useTemplateRef('carousel')
const selectedIndex = ref(0)
const mirrored = ref(false)

watch(
  () => carouselRef.value?.emblaApi,
  (api) => {
    if (!api) return
    api.on('select', () => {
      selectedIndex.value = api.selectedScrollSnap()
    })
  }
)

function scrollPrev() {
  carouselRef.value?.emblaApi?.scrollPrev()
}
function scrollNext() {
  carouselRef.value?.emblaApi?.scrollNext()
}
function scrollTo(index: number) {
  carouselRef.value?.emblaApi?.scrollTo(index)
}
</script>

<template>
  <div
    v-if="mode === 'compact'"
    class="relative w-full h-full group/gallery"
  >
    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      :items="displayImages"
      :dots="hasMultiple"
      :ui="{ dots: 'bottom-1.5', dot: 'size-1.5' }"
      class="w-full h-full"
    >
      <img
        :src="item"
        class="w-full h-full object-cover"
        alt="zdjęcie projektu"
        loading="lazy"
      >
    </UCarousel>

    <template v-if="hasMultiple">
      <button
        type="button"
        aria-label="Poprzednie zdjęcie"
        class="absolute left-1 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-white/85 text-gray-800 shadow flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity cursor-pointer"
        @click.prevent="scrollPrev"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="size-4"
        />
      </button>
      <button
        type="button"
        aria-label="Następne zdjęcie"
        class="absolute right-1 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full bg-white/85 text-gray-800 shadow flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity cursor-pointer"
        @click.prevent="scrollNext"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </button>
    </template>
  </div>

  <!-- Full mode: aspect-ratio main image + thumbnail strip -->
  <div
    v-else
    class="w-full flex flex-col gap-3"
  >
    <div class="relative aspect-video w-full rounded-xl overflow-hidden border border-default group/gallery">
      <UCarousel
        ref="carousel"
        v-slot="{ item }"
        :items="displayImages"
        :dots="false"
        :class="['w-full h-full transition-transform duration-300', { '-scale-x-100': mirrored }]"
      >
        <img
          :src="item"
          class="w-full h-full object-cover"
          alt="zdjęcie projektu"
          loading="eager"
        >
      </UCarousel>

      <template v-if="hasMultiple">
        <button
          type="button"
          aria-label="Poprzednie zdjęcie"
          class="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/85 text-gray-800 shadow flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          @click.prevent="scrollPrev"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-5"
          />
        </button>
        <button
          type="button"
          aria-label="Następne zdjęcie"
          class="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/85 text-gray-800 shadow flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          @click.prevent="scrollNext"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </button>
      </template>

      <!-- Przycisk lustrzanego odbicia -->
      <button
        type="button"
        :aria-label="mirrored ? 'Wyłącz odbicie lustrzane' : 'Włącz odbicie lustrzane'"
        :class="[
          'absolute bottom-2 right-2 z-10 size-9 rounded-full shadow flex items-center justify-center transition-all cursor-pointer',
          mirrored
            ? 'bg-primary text-white opacity-100'
            : 'bg-white/85 text-gray-800 opacity-70 hover:opacity-100'
        ]"
        @click.prevent="mirrored = !mirrored"
      >
        <UIcon
          name="i-lucide-flip-horizontal-2"
          class="size-5"
        />
      </button>
    </div>

    <!-- Thumbnail strip -->
    <div
      v-if="hasMultiple"
      class="flex gap-2 overflow-x-auto pb-1"
    >
      <button
        v-for="(url, index) in displayImages"
        :key="url"
        type="button"
        :aria-label="`Zdjęcie ${index + 1}`"
        :class="[
          'shrink-0 size-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
          selectedIndex === index
            ? 'border-primary opacity-100'
            : 'border-transparent opacity-60 hover:opacity-90'
        ]"
        @click="scrollTo(index)"
      >
        <img
          :src="url"
          :class="['w-full h-full object-cover transition-transform duration-300', { '-scale-x-100': mirrored }]"
          alt=""
          loading="lazy"
        >
      </button>
    </div>
  </div>
</template>
