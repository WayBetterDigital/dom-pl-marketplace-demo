<script setup lang="ts">
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import {
  useGalleryService,
  GALLERY_CATEGORIES,
  ALL_CATEGORY
} from '~/composables/services/useGalleryService'
import type { GalleryCategory, GalleryImage } from '~/composables/services/useGalleryService'

const route = useRoute()
const id = route.params.id as string
const vendorId = route.query.vendorId as string
const toast = useToast()

const housePlanService = useHousePlanService()
const {
  getGallery,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} = useGalleryService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

const { data: allImages, refresh: refreshGallery } = await useAsyncData(
  `gallery-${id}`,
  () => getGallery(id)
)

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  wizualizacje: 'Wizualizacje',
  strefa_dzienna: 'Strefa dzienna',
  kuchnia: 'Kuchnia',
  lazienka: 'Łazienka'
}
const categoryOptions = GALLERY_CATEGORIES.map(c => ({ label: CATEGORY_LABELS[c], value: c }))

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

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxImage = computed(() => filteredImages.value[lightboxIndex.value])

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
function lightboxPrev() {
  lightboxIndex.value = (lightboxIndex.value - 1 + filteredImages.value.length) % filteredImages.value.length
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

const addOpen = ref(false)
const addDescription = ref('')
const addCategory = ref<GalleryCategory>('wizualizacje')
const addFile = ref<File | null>(null)
const addPreview = ref<string | null>(null)
const addSubmitting = ref(false)

function handleAddFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'Za duży plik', description: 'Maks. 10 MB', color: 'warning' })
    return
  }
  addFile.value = file
  addPreview.value = URL.createObjectURL(file)
}
function closeAdd() {
  addOpen.value = false
  addFile.value = null
  if (addPreview.value) URL.revokeObjectURL(addPreview.value)
  addPreview.value = null
  addDescription.value = ''
  addCategory.value = 'wizualizacje'
}
async function submitAdd() {
  if (!vendorId || !addFile.value) return
  addSubmitting.value = true
  try {
    await uploadGalleryImage(vendorId, id, addFile.value, addDescription.value || undefined, addCategory.value)
    await refreshGallery()
    toast.add({ title: 'Zdjęcie dodane', color: 'success' })
    closeAdd()
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się dodać zdjęcia.', color: 'error' })
  } finally {
    addSubmitting.value = false
  }
}

const editImage = ref<GalleryImage | null>(null)
const editOpen = computed({
  get: () => editImage.value !== null,
  set: (v) => { if (!v) editImage.value = null }
})
const editDescription = ref('')
const editCategory = ref<GalleryCategory>('wizualizacje')
const editSubmitting = ref(false)

function openEdit(img: GalleryImage) {
  editImage.value = img
  editDescription.value = img.description ?? ''
  editCategory.value = img.category as GalleryCategory
}
async function submitEdit() {
  if (!vendorId || !editImage.value) return
  editSubmitting.value = true
  try {
    await updateGalleryImage(vendorId, id, editImage.value.id, {
      description: editDescription.value || undefined,
      category: editCategory.value
    })
    await refreshGallery()
    toast.add({ title: 'Zapisano', color: 'success' })
    editImage.value = null
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się zapisać.', color: 'error' })
  } finally {
    editSubmitting.value = false
  }
}

const deleteSubmitting = ref(false)
async function handleDelete(img: GalleryImage) {
  if (!vendorId) return
  deleteSubmitting.value = true
  try {
    await deleteGalleryImage(vendorId, id, img.id)
    await refreshGallery()
    toast.add({ title: 'Zdjęcie usunięte', color: 'success' })
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć.', color: 'error' })
  } finally {
    deleteSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <div class="mb-4">
      <UButton :to="`/konto/sprzedawca?id=${vendorId}`" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
        Wróć do panelu sprzedawcy
      </UButton>
    </div>

    <VendorPlanTabNav :plan-id="id" :vendor-id="vendorId" class="mb-8" />

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-default">{{ plan?.title }}</h1>
      <UButton icon="i-lucide-image-plus" size="sm" @click="addOpen = true">Dodaj zdjęcie</UButton>
    </div>

    <template v-if="!allImages?.length">
      <div class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
        <UIcon name="i-lucide-images" class="size-12 text-muted" />
        <p class="text-muted text-sm">Galeria wizualizacji jest pusta.</p>
      </div>
    </template>

    <template v-else>
      <div v-if="showTabs" class="flex gap-2 flex-wrap mb-6">
        <button type="button" :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border', activeCategory === ALL_CATEGORY ? 'bg-primary text-white border-primary' : 'bg-transparent text-default border-default hover:border-primary hover:text-primary']" @click="activeCategory = ALL_CATEGORY">
          Wszystkie ({{ allImages?.length }})
        </button>
        <button v-for="cat in availableCategories" :key="cat" type="button" :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border', activeCategory === cat ? 'bg-primary text-white border-primary' : 'bg-transparent text-default border-default hover:border-primary hover:text-primary']" @click="activeCategory = cat">
          {{ CATEGORY_LABELS[cat] }} ({{ (allImages ?? []).filter(img => img.category === cat).length }})
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div v-for="(image, index) in filteredImages" :key="image.id" class="group relative aspect-square rounded-xl overflow-hidden border border-default bg-muted">
          <button type="button" class="absolute inset-0 w-full h-full cursor-pointer focus:outline-none" :aria-label="image.description ?? 'Otwórz zdjęcie'" @click="openLightbox(index)">
            <img :src="image.url" :alt="image.description ?? 'Zdjęcie projektu'" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy">
          </button>
          <div v-if="image.description" class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
            <p class="text-white text-xs line-clamp-2">{{ image.description }}</p>
          </div>
          <div class="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button type="button" class="size-7 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center cursor-pointer shadow transition-colors" @click.stop="openEdit(image)">
              <UIcon name="i-lucide-pencil" class="size-3.5" />
            </button>
            <button type="button" class="size-7 rounded-full bg-red-500/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow transition-colors" :disabled="deleteSubmitting" @click.stop="handleDelete(image)">
              <UIcon name="i-lucide-trash-2" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <UModal v-model:open="lightboxOpen" :ui="{ content: 'max-w-5xl w-full bg-transparent shadow-none ring-0 p-0' }">
      <template #content>
        <div class="relative flex items-center justify-center" @click.self="lightboxOpen = false">
          <div class="relative w-full max-h-[90vh] flex flex-col items-center">
            <img v-if="lightboxImage" :src="lightboxImage.url" :alt="lightboxImage.description ?? 'Zdjęcie projektu'" class="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl">
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="addOpen" title="Dodaj zdjęcie do galerii" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4 p-1">
          <div v-if="addPreview" class="aspect-video rounded-lg overflow-hidden border border-default bg-muted">
            <img :src="addPreview" class="w-full h-full object-cover" alt="">
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-default">Plik zdjęcia *</label>
            <label class="cursor-pointer block">
              <input type="file" accept="image/*" class="hidden" @change="handleAddFileChange">
              <div class="flex items-center gap-2 border border-dashed border-default rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors">
                <UIcon name="i-lucide-image-plus" class="size-5 text-muted shrink-0" />
                <span class="text-sm text-muted">{{ addFile ? addFile.name : 'Wybierz plik...' }}</span>
              </div>
            </label>
          </div>
          <UInput v-model="addDescription" placeholder="Opis (opcjonalny)" />
          <USelect v-model="addCategory" :items="categoryOptions" value-key="value" label-key="label" />
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="closeAdd">Anuluj</UButton>
        <UButton :loading="addSubmitting" :disabled="!addFile" @click="submitAdd">Dodaj</UButton>
      </template>
    </UModal>

    <UModal v-model:open="editOpen" title="Edytuj zdjęcie" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4 p-1">
          <UInput v-model="editDescription" placeholder="Opis zdjęcia..." />
          <USelect v-model="editCategory" :items="categoryOptions" value-key="value" label-key="label" />
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="editImage = null">Anuluj</UButton>
        <UButton :loading="editSubmitting" @click="submitEdit">Zapisz</UButton>
      </template>
    </UModal>
  </div>
</template>
