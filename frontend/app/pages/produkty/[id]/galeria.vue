<script setup lang="ts">
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import { useGalleryService, GALLERY_CATEGORIES, ALL_CATEGORY } from '~/composables/services/useGalleryService'
import type { GalleryCategory, GalleryImage } from '~/composables/services/useGalleryService'

const route = useRoute()
const id = route.params.id as string

const housePlanService = useHousePlanService()
const { getGallery } = useGalleryService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Projekt nie znaleziony',
    fatal: true
  })
}

const { data: allImages, pending } = await useAsyncData(
  `gallery-${id}`,
  () => getGallery(id)
)

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  wizualizacje: 'Wizualizacje',
  strefa_dzienna: 'Strefa dzienna',
  kuchnia: 'Kuchnia',
  lazienka: 'Łazienka'
}

// Only show tabs for categories that have at least one image
const availableCategories = computed(() => {
  const images = allImages.value ?? []
  return GALLERY_CATEGORIES.filter(c => images.some(img => img.category === c))
})

const showTabs = computed(() => availableCategories.value.length > 1)

const activeCategory = ref<GalleryCategory | typeof ALL_CATEGORY>(ALL_CATEGORY)

const filteredImages = computed<GalleryImage[]>(() => {
  const images = allImages.value ?? []
  if (activeCategory.value === ALL_CATEGORY) return images
  return images.filter(img => img.category === activeCategory.value)
})

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function lightboxPrev() {
  lightboxIndex.value =
    (lightboxIndex.value - 1 + filteredImages.value.length) % filteredImages.value.length
}

function lightboxNext() {
  lightboxIndex.value = (lightboxIndex.value + 1) % filteredImages.value.length
}

function onLightboxKey(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'ArrowRight') lightboxNext()
  if (e.key === 'Escape') lightboxOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onLightboxKey))
onUnmounted(() => window.removeEventListener('keydown', onLightboxKey))

const lightboxImage = computed(() => filteredImages.value[lightboxIndex.value])
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Back Button -->
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

    <!-- Tab navigation -->
    <PlanTabNav :plan-id="id" class="mb-8" />

    <!-- Plan title -->
    <h1 class="text-2xl font-bold text-default mb-6">
      {{ plan?.title }}
    </h1>

    <!-- Loading skeleton -->
    <template v-if="pending">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="n in 8"
          :key="n"
          class="aspect-square rounded-xl bg-muted animate-pulse"
        />
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!allImages?.length">
      <div class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
        <UIcon name="i-lucide-images" class="size-12 text-muted" />
        <p class="text-muted text-sm">
          Galeria wizualizacji jest pusta.
        </p>
      </div>
    </template>

    <!-- Gallery with tabs -->
    <template v-else>
      <!-- Category tabs -->
      <div
        v-if="showTabs"
        class="flex gap-2 flex-wrap mb-6"
      >
        <button
          type="button"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border',
            activeCategory === ALL_CATEGORY
              ? 'bg-primary text-white border-primary'
              : 'bg-transparent text-default border-default hover:border-primary hover:text-primary'
          ]"
          @click="activeCategory = ALL_CATEGORY"
        >
          Wszystkie ({{ allImages?.length }})
        </button>
        <button
          v-for="cat in availableCategories"
          :key="cat"
          type="button"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border',
            activeCategory === cat
              ? 'bg-primary text-white border-primary'
              : 'bg-transparent text-default border-default hover:border-primary hover:text-primary'
          ]"
          @click="activeCategory = cat"
        >
          {{ CATEGORY_LABELS[cat] }} ({{ (allImages ?? []).filter(img => img.category === cat).length }})
        </button>
      </div>

      <!-- Image grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="(image, index) in filteredImages"
          :key="image.id"
          type="button"
          class="group relative aspect-square rounded-xl overflow-hidden border border-default bg-muted cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          @click="openLightbox(index)"
        >
          <img
            :src="image.url"
            :alt="image.description ?? 'Zdjęcie projektu'"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          >
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div
            v-if="image.description"
            class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2"
          >
            <p class="text-white text-xs line-clamp-2">
              {{ image.description }}
            </p>
          </div>
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <UIcon name="i-lucide-zoom-in" class="size-5 text-white drop-shadow" />
          </div>
        </button>
      </div>
    </template>

    <!-- Lightbox -->
    <UModal
      v-model:open="lightboxOpen"
      :ui="{ content: 'max-w-5xl w-full bg-transparent shadow-none ring-0 p-0' }"
    >
      <template #content>
        <div
          class="relative flex items-center justify-center"
          @click.self="lightboxOpen = false"
        >
          <div class="relative w-full max-h-[90vh] flex flex-col items-center">
            <!-- Image -->
            <img
              v-if="lightboxImage"
              :src="lightboxImage.url"
              :alt="lightboxImage.description ?? 'Zdjęcie projektu'"
              class="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            >

            <!-- Description -->
            <p
              v-if="lightboxImage?.description"
              class="mt-3 text-sm text-white/80 text-center px-4"
            >
              {{ lightboxImage.description }}
            </p>

            <!-- Counter -->
            <p class="mt-2 text-xs text-white/50">
              {{ lightboxIndex + 1 }} / {{ filteredImages.length }}
            </p>
          </div>

          <!-- Prev/Next buttons -->
          <button
            v-if="filteredImages.length > 1"
            type="button"
            aria-label="Poprzednie"
            class="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            @click="lightboxPrev"
          >
            <UIcon name="i-lucide-chevron-left" class="size-6" />
          </button>
          <button
            v-if="filteredImages.length > 1"
            type="button"
            aria-label="Następne"
            class="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            @click="lightboxNext"
          >
            <UIcon name="i-lucide-chevron-right" class="size-6" />
          </button>

          <!-- Close -->
          <button
            type="button"
            aria-label="Zamknij"
            class="absolute top-2 right-2 size-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            @click="lightboxOpen = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
      </template>
    </UModal>
  </div>
</template>
