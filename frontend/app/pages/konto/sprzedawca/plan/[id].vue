<script setup lang="ts">
definePageMeta({ middleware: 'vendor-auth' })
import { createError, useAsyncData } from "#imports";
import { useHousePlanService } from "~/composables/services/useHousePlanService";
import { useVendorService } from "~/composables/services/useVendorService";
import { useVendorPlanForm } from "~/composables/useVendorPlanForm";

const route = useRoute()
const toast = useToast()
const vendorId = route.query.vendorId as string
const planId = route.params.id as string

const { getHousePlan } = useHousePlanService();
const { updateVendorHousePlan } = useVendorService();

const { data: plan, error, refresh } = await useAsyncData(`vendor-plan-edit-${planId}`, () => getHousePlan(planId))
if (error.value || !plan.value) throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })

const {
  form,
  errors,
  roofLabel,
  dimensionsLabel,
  validate,
  toUpdatePayload,
  loadFromPlan,
} = useVendorPlanForm();

watch(
  () => plan.value,
  (value) => {
    if (value) loadFromPlan(value);
  },
  { immediate: true },
);

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref<'dane' | 'galeria' | 'pliki'>('dane')

// ── Save plan data ────────────────────────────────────────────────────────────
const saving = ref(false)
async function handleSave() {
  if (!vendorId) { toast.add({ title: 'Brak vendorId', color: 'error' }); return }
  if (!validate()) {
    activeTab.value = 'dane'
    toast.add({ title: 'Uzupełnij wymagane pola w zakładce Dane projektu', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const updated = await updateVendorHousePlan(vendorId, planId, toUpdatePayload())
    plan.value = updated
    loadFromPlan(updated)
    toast.add({ title: 'Zapisano zmiany', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się zapisać zmian.', color: 'error' })
  } finally {
    saving.value = false
  }
}

// ── Gallery ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  wizualizacje: 'Wizualizacje',
  strefa_dzienna: 'Strefa dzienna',
  kuchnia: 'Kuchnia',
  lazienka: 'Łazienka'
}
const categoryOptions = GALLERY_CATEGORIES.map(c => ({ label: CATEGORY_LABELS[c], value: c }))

const { data: galleryImages, refresh: refreshGallery } = await useAsyncData(
  `gallery-edit-${planId}`,
  () => getGallery(planId)
)

const availableCategories = computed(() =>
  GALLERY_CATEGORIES.filter(c => (galleryImages.value ?? []).some(img => img.category === c))
)
const showCategoryTabs = computed(() => availableCategories.value.length > 1)
const activeCategory = ref<GalleryCategory | typeof ALL_CATEGORY>(ALL_CATEGORY)
const filteredImages = computed<GalleryImage[]>(() => {
  const images = galleryImages.value ?? []
  return activeCategory.value === ALL_CATEGORY
    ? images
    : images.filter(img => img.category === activeCategory.value)
})

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxImage = computed(() => filteredImages.value[lightboxIndex.value])
function openLightbox(index: number) { lightboxIndex.value = index; lightboxOpen.value = true }
function lightboxPrev() { lightboxIndex.value = (lightboxIndex.value - 1 + filteredImages.value.length) % filteredImages.value.length }
function lightboxNext() { lightboxIndex.value = (lightboxIndex.value + 1) % filteredImages.value.length }
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
  if (file.size > 10 * 1024 * 1024) { toast.add({ title: 'Za duży plik', description: 'Maks. 10 MB', color: 'warning' }); return }
  addFile.value = file
  if (addPreview.value) URL.revokeObjectURL(addPreview.value)
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
    await uploadGalleryImage(vendorId, planId, addFile.value, addDescription.value || undefined, addCategory.value)
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

function openEditImage(img: GalleryImage) {
  editImage.value = img
  editDescription.value = img.description ?? ''
  editCategory.value = img.category as GalleryCategory
}
async function submitEdit() {
  if (!vendorId || !editImage.value) return
  editSubmitting.value = true
  try {
    await updateGalleryImage(vendorId, planId, editImage.value.id, {
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

const galleryDeleteSubmitting = ref(false)
async function handleGalleryDelete(img: GalleryImage) {
  if (!vendorId) return
  galleryDeleteSubmitting.value = true
  try {
    await deleteGalleryImage(vendorId, planId, img.id)
    await refreshGallery()
    toast.add({ title: 'Zdjęcie usunięte', color: 'success' })
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć.', color: 'error' })
  } finally {
    galleryDeleteSubmitting.value = false
  }
}

// ── Files ─────────────────────────────────────────────────────────────────────
const { data: files, refresh: refreshFiles } = await useAsyncData(
  `files-edit-${planId}`,
  () => getFiles(planId)
)

const uploadingFiles = ref<{ name: string }[]>([])
const deletingFileId = ref<string | null>(null)
const isUploading = computed(() => uploadingFiles.value.length > 0)

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  input.value = ''
  if (!selected.length) return
  for (const file of selected) {
    if (file.size > 35 * 1024 * 1024) {
      toast.add({ title: 'Plik za duży', description: `${file.name} przekracza 35 MB.`, color: 'warning' })
      continue
    }
    uploadingFiles.value.push({ name: file.name })
    try {
      await uploadFile(planId, file)
      toast.add({ title: 'Plik dodany', description: file.name, color: 'success' })
    } catch {
      toast.add({ title: 'Błąd', description: `Nie udało się wgrać ${file.name}`, color: 'error' })
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(f => f.name !== file.name)
    }
  }
  await refreshFiles()
}

async function handleFileDelete(fileId: string, fileName: string) {
  if (!confirm(`Usunąć plik "${fileName}"?`)) return
  deletingFileId.value = fileId
  try {
    await deleteFile(planId, fileId)
    await refreshFiles()
    toast.add({ title: 'Plik usunięty', color: 'success' })
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć pliku.', color: 'error' })
  } finally {
    deletingFileId.value = null
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between gap-4">
      <UButton
        :to="`/konto/sprzedawca?id=${vendorId}`"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do panelu sprzedawcy
      </UButton>
      <UButton
        v-if="activeTab === 'dane'"
        size="lg"
        icon="i-lucide-save"
        :loading="saving"
        class="cursor-pointer"
        @click="handleSave"
      >
        Zapisz zmiany
      </UButton>
    </div>

    <!-- Tab nav -->
    <nav class="border-b border-default mb-8">
      <div class="flex gap-0">
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'dane' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default'
          ]"
          @click="activeTab = 'dane'"
        >
          Dane projektu
        </button>
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'galeria' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default'
          ]"
          @click="activeTab = 'galeria'"
        >
          Galeria
          <span
            v-if="galleryImages?.length"
            class="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-xs font-semibold"
          >
            {{ galleryImages.length }}
          </span>
        </button>
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'pliki' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default'
          ]"
          @click="activeTab = 'pliki'"
        >
          Pliki
          <span
            v-if="files?.length"
            class="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-xs font-semibold"
          >
            {{ files.length }}
          </span>
        </button>
      </div>
    </nav>

    <!-- ── Zakładka: Dane projektu ─────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'dane'"
      class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
    >
      <!-- Lewa kolumna: galeria główna + opis + szkice -->
      <div class="flex flex-col gap-8">
        <PlanImageGallery
          :images="plan?.images ?? []"
          :thumbnail="plan?.thumbnail"
          mode="full"
        />

        <div>
          <h2 class="text-xl font-semibold text-default mb-4">
            Opis projektu
          </h2>
          <UTextarea
            v-model="form.description"
            :rows="8"
            class="w-full"
            placeholder="Opisz projekt — styl, rozwiązania architektoniczne, przeznaczenie..."
          />
        </div>

        <PlanSketches :plan-id="planId" />
      </div>

      <!-- Prawa kolumna: tytuł, cena, pola -->
      <div class="space-y-8">
        <div>
          <input
            v-model="form.title"
            size="xl"
            placeholder="Nazwa projektu"
            class="mb-2"
            :color="errors.title ? 'error' : 'neutral'"
          />
          <UInput
            v-model="form.price"
            type="number"
            placeholder="Cena (PLN)"
            :color="errors.price ? 'error' : 'neutral'"
          />
        </div>

        <UCard v-if="plan?.vendor">
          <template #header>
            <h3 class="text-lg font-semibold">Sprzedawca</h3>
          </template>
          <div class="flex items-start gap-4">
            <UAvatar :alt="plan.vendor.company_name" size="lg" />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-default truncate">{{ plan.vendor.company_name }}</p>
              <p class="text-sm text-muted">{{ plan.vendor.first_name }} {{ plan.vendor.last_name }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Szczegóły projektu
            </h3>
          </template>

          <div class="space-y-0">
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-maximize" class="size-5 shrink-0" />
                <span class="text-sm">Powierzchnia użytkowa <span class="text-error">*</span></span>
              </div>
              <div class="flex items-center gap-1.5">
                <UInput v-model="form.house_area" type="number" size="xs" :color="errors.house_area ? 'error' : 'neutral'" class="w-20 [&_input]:text-right" placeholder="—" />
                <span class="text-sm text-muted">m²</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-thermometer" class="size-5 shrink-0" />
                <span class="text-sm">Powierzchnia kotłowni</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UInput v-model="form.boiler_room_area" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
                <span class="text-sm text-muted">m²</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-door-open" class="size-5 shrink-0" />
                <span class="text-sm">Liczba pokoi <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.rooms" type="number" size="xs" :color="errors.rooms ? 'error' : 'neutral'" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-layers" class="size-5 shrink-0" />
                <span class="text-sm">Liczba kondygnacji</span>
              </div>
              <UInput v-model="form.floors" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-bath" class="size-5 shrink-0" />
                <span class="text-sm">Łazienki i WC <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.bathrooms_and_wc" type="number" size="xs" :color="errors.bathrooms_and_wc ? 'error' : 'neutral'" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-ruler" class="size-5 shrink-0" />
                <span class="text-sm">Min. wymiary działki <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.plot_dimensions" size="xs" :color="errors.plot_dimensions ? 'error' : 'neutral'" class="w-28 [&_input]:text-right" placeholder="np. 20×30" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-ruler" class="size-5 shrink-0" />
                <span class="text-sm">Wymiary po adaptacji</span>
              </div>
              <UInput v-model="form.min_plot_dimensions_after_adaptation" size="xs" class="w-28 [&_input]:text-right" placeholder="—" />
            </div>
          </div>

          <template #footer>
            <p class="text-xs text-muted">
              <span class="text-error">*</span> Pola wymagane
            </p>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Charakterystyka budynku
            </h3>
          </template>

          <div class="space-y-0">
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-home" class="size-5 shrink-0" />
                <span class="text-sm">Typ domu</span>
              </div>
              <USelect v-model="form.house_type" :items="[{ label: 'Jednorodzinny', value: 'jednorodzinny' }, { label: 'Bliźniak', value: 'bliźniak' }, { label: 'Rekreacyjny', value: 'rekreacyjny' }]" value-key="value" label-key="label" size="xs" class="w-44" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-pen-tool" class="size-5 shrink-0" />
                <span class="text-sm">Styl architektoniczny</span>
              </div>
              <USelect v-model="form.architectural_style" :items="[{ label: 'Tradycyjny', value: 'tradycyjny' }, { label: 'Nowoczesny', value: 'nowoczesny' }, { label: 'Klasyczny', value: 'klasyczny' }, { label: 'Skandynawski', value: 'skandynawski' }]" value-key="value" label-key="label" size="xs" class="w-44" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-zap" class="size-5 shrink-0" />
                <span class="text-sm">Standard energetyczny</span>
              </div>
              <USelect v-model="form.energy_standard" :items="[{ label: 'Standard', value: 'standard' }, { label: 'Energooszczędny', value: 'energooszczędny' }, { label: 'Pasywny', value: 'pasywny' }]" value-key="value" label-key="label" size="xs" class="w-44" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-car" class="size-5 shrink-0" />
                <span class="text-sm">Garaż</span>
              </div>
              <USelect v-model="form.garage" :items="[{ label: 'Brak', value: 'brak' }, { label: 'Jednostanowiskowy', value: 'jednostanowiskowy' }, { label: 'Dwustanowiskowy', value: 'dwustanowiskowy' }, { label: 'Trzystanowiskowy', value: 'trzystanowiskowy' }]" value-key="value" label-key="label" size="xs" class="w-44" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-arrow-down-to-line" class="size-5 shrink-0" />
                <span class="text-sm">Piwnica</span>
              </div>
              <USelect v-model="form.basement" :items="[{ label: 'Brak', value: 'brak' }, { label: 'Częściowa', value: 'częściowa' }, { label: 'Pełna', value: 'pełna' }]" value-key="value" label-key="label" size="xs" class="w-44" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-flame" class="size-5 shrink-0" />
                <span class="text-sm">Kominek</span>
              </div>
              <USelect v-model="form.fireplace" :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]" value-key="value" label-key="label" size="xs" class="w-28" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-sun" class="size-5 shrink-0" />
                <span class="text-sm">Taras</span>
              </div>
              <USelect v-model="form.terrace" :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]" value-key="value" label-key="label" size="xs" class="w-28" placeholder="—" />
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-triangle" class="size-5 shrink-0" />
                <span class="text-sm">Dach</span>
              </div>
              <div class="flex items-center gap-1.5">
                <USelect v-model="form.roof_type" :items="[{ label: 'Dwuspadowy', value: 'dwuspadowy' }, { label: 'Czterospadowy', value: 'czterospadowy' }, { label: 'Płaski', value: 'płaski' }, { label: 'Mansardowy', value: 'mansardowy' }, { label: 'Jednospadowy', value: 'jednospadowy' }]" value-key="value" label-key="label" size="xs" class="w-36" placeholder="Typ" />
                <UInput v-model="form.roof_angle" type="number" size="xs" class="w-16 [&_input]:text-right" placeholder="°" />
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-move-horizontal" class="size-5 shrink-0" />
                <span class="text-sm">Wymiary budynku</span>
              </div>
              <div class="flex items-center gap-1 text-sm text-muted">
                <UInput v-model="form.building_width" type="number" size="xs" class="w-16 [&_input]:text-right" placeholder="szer." />
                <span>×</span>
                <UInput v-model="form.building_length" type="number" size="xs" class="w-16 [&_input]:text-right" placeholder="dł." />
                <span>m</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-move-vertical" class="size-5 shrink-0" />
                <span class="text-sm">Wysokość budynku</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UInput v-model="form.building_height" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
                <span class="text-sm text-muted">m</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-square" class="size-5 shrink-0" />
                <span class="text-sm">Powierzchnia zabudowy</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UInput v-model="form.building_footprint" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
                <span class="text-sm text-muted">m²</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-layout" class="size-5 shrink-0" />
                <span class="text-sm">Powierzchnia całkowita</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UInput v-model="form.total_area" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
                <span class="text-sm text-muted">m²</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- ── Zakładka: Galeria ───────────────────────────────────────────────── -->
    <div v-show="activeTab === 'galeria'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-default">
            Galeria wizualizacji
          </h2>
          <p class="text-sm text-muted mt-0.5">
            Zmiany w galerii są zapisywane natychmiast.
          </p>
        </div>
        <UButton
          icon="i-lucide-image-plus"
          size="sm"
          class="cursor-pointer"
          @click="addOpen = true"
        >
          Dodaj zdjęcie
        </UButton>
      </div>

      <template v-if="!galleryImages?.length">
        <div class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
          <UIcon name="i-lucide-images" class="size-12 text-muted" />
          <div>
            <p class="text-default font-medium">
              Brak zdjęć
            </p>
            <p class="text-sm text-muted mt-1">
              Kliknij „Dodaj zdjęcie" żeby dodać wizualizacje.
            </p>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-if="showCategoryTabs"
          class="flex gap-2 flex-wrap mb-6"
        >
          <button
            type="button"
            :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border', activeCategory === ALL_CATEGORY ? 'bg-primary text-white border-primary' : 'bg-transparent text-default border-default hover:border-primary hover:text-primary']"
            @click="activeCategory = ALL_CATEGORY"
          >
            Wszystkie ({{ galleryImages?.length }})
          </button>
          <button
            v-for="cat in availableCategories"
            :key="cat"
            type="button"
            :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer border', activeCategory === cat ? 'bg-primary text-white border-primary' : 'bg-transparent text-default border-default hover:border-primary hover:text-primary']"
            @click="activeCategory = cat"
          >
            {{ CATEGORY_LABELS[cat] }} ({{ (galleryImages ?? []).filter(img => img.category === cat).length }})
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(image, index) in filteredImages"
            :key="image.id"
            class="group relative aspect-square rounded-xl overflow-hidden border border-default bg-muted"
          >
            <button
              type="button"
              class="absolute inset-0 w-full h-full cursor-pointer focus:outline-none"
              :aria-label="image.description ?? 'Otwórz zdjęcie'"
              @click="openLightbox(index)"
            >
              <img
                :src="image.url"
                :alt="image.description ?? 'Zdjęcie projektu'"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              >
            </button>
            <div
              v-if="image.description"
              class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none"
            >
              <p class="text-white text-xs line-clamp-2">
                {{ image.description }}
              </p>
            </div>
            <div class="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                type="button"
                class="size-7 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center cursor-pointer shadow transition-colors"
                @click.stop="openEditImage(image)"
              >
                <UIcon name="i-lucide-pencil" class="size-3.5" />
              </button>
              <button
                type="button"
                class="size-7 rounded-full bg-red-500/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow transition-colors"
                :disabled="galleryDeleteSubmitting"
                @click.stop="handleGalleryDelete(image)"
              >
                <UIcon name="i-lucide-trash-2" class="size-3.5" />
              </button>
            </div>
          </div>
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
              <img
                v-if="lightboxImage"
                :src="lightboxImage.url"
                :alt="lightboxImage.description ?? 'Zdjęcie projektu'"
                class="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
              >
            </div>
          </div>
        </template>
      </UModal>

      <!-- Add modal -->
      <UModal
        v-model:open="addOpen"
        title="Dodaj zdjęcie do galerii"
        :ui="{ footer: 'justify-end' }"
      >
        <template #body>
          <div class="space-y-4 p-1">
            <div
              v-if="addPreview"
              class="aspect-video rounded-lg overflow-hidden border border-default bg-muted"
            >
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

      <!-- Edit modal -->
      <UModal
        v-model:open="editOpen"
        title="Edytuj zdjęcie"
        :ui="{ footer: 'justify-end' }"
      >
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

    <!-- ── Zakładka: Pliki ─────────────────────────────────────────────────── -->
    <div v-show="activeTab === 'pliki'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-default">
            Pliki dokumentacji
          </h2>
          <p class="text-sm text-muted mt-0.5">
            Pliki są wgrywane i usuwane natychmiast.
          </p>
        </div>
        <label class="cursor-pointer">
          <input type="file" multiple class="hidden" @change="handleFileChange">
          <UButton as="span" icon="i-lucide-upload" size="sm" :loading="isUploading">Wgraj pliki</UButton>
        </label>
      </div>

      <div v-if="uploadingFiles.length" class="flex flex-col gap-2 mb-4">
        <div
          v-for="f in uploadingFiles"
          :key="f.name"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border border-default bg-muted/50 animate-pulse"
        >
          <UIcon name="i-lucide-loader-circle" class="size-5 text-muted animate-spin shrink-0" />
          <span class="text-sm text-muted truncate">Wgrywanie: {{ f.name }}</span>
        </div>
      </div>

      <div
        v-if="!files?.length && !isUploading"
        class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center"
      >
        <UIcon name="i-lucide-folder-open" class="size-12 text-muted" />
        <div>
          <p class="text-default font-medium">
            Brak plików
          </p>
          <p class="text-sm text-muted mt-1">
            Kliknij „Wgraj pliki" żeby dodać pliki dokumentacji.
          </p>
        </div>
      </div>

      <div v-else-if="files?.length" class="flex flex-col gap-2">
        <div
          v-for="file in files"
          :key="file.id"
          class="group flex items-center gap-4 px-4 py-3 rounded-xl border border-default hover:bg-muted/50 transition-colors"
        >
          <UIcon :name="fileIcon(file.mime_type)" :class="['size-8 shrink-0', fileIconColor(file.mime_type)]" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-default truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-muted">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton
              icon="i-lucide-eye"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Podgląd"
              class="cursor-pointer"
              @click="window.open(file.url, '_blank', 'noopener,noreferrer')"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              aria-label="Usuń"
              :loading="deletingFileId === file.id"
              :disabled="deletingFileId !== null"
              class="cursor-pointer"
              @click="handleFileDelete(file.id, file.name)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
