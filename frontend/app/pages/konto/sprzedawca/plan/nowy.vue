<script setup lang="ts">
import { useVendorService } from '~/composables/services/useVendorService'
import { useVendorPlanForm } from '~/composables/useVendorPlanForm'
import { useGalleryService, GALLERY_CATEGORIES } from '~/composables/services/useGalleryService'
import { useFileService, formatFileSize, fileIcon, fileIconColor } from '~/composables/services/useFileService'
import type { GalleryCategory } from '~/composables/services/useGalleryService'
import type { AppHousePlan } from '~/types/house-plan'

definePageMeta({ middleware: 'vendor-auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const vendorId = route.query.vendorId as string

const { createVendorHousePlan, uploadHousePlanImages, listVendorPlanFamilies, getVendorHousePlans } = useVendorService()
const { uploadGalleryImage } = useGalleryService()
const { uploadFile } = useFileService()

const { form, errors, validate, toCreatePayload, applyPrefillToEmptyFields } = useVendorPlanForm()

const activeTab = ref<'dane' | 'galeria' | 'pliki'>('dane')
const creating = ref(false)
const families = ref<Array<{ id: string; name: string }>>([])
const sourcePlanId = ref('')
const vendorPlans = ref<AppHousePlan[]>([])

const mainImages = ref<File[]>([])
const mainPreviews = ref<string[]>([])

type StagedImage = { file: File; preview: string; description: string; category: GalleryCategory }
const stagedImages = ref<StagedImage[]>([])
const stagedFiles = ref<File[]>([])

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  wizualizacje: 'Wizualizacje',
  strefa_dzienna: 'Strefa dzienna',
  kuchnia: 'Kuchnia',
  lazienka: 'Łazienka',
}
const categoryOptions = GALLERY_CATEGORIES.map(c => ({ label: CATEGORY_LABELS[c], value: c }))

const familyOptions = computed(() => [
  { label: 'Brak rodziny', value: 'none' },
  ...families.value.map(f => ({ label: f.name, value: f.id })),
])

const currentFamilyPlans = computed(() =>
  vendorPlans.value.filter(plan => plan.family?.id === form.value.family_id)
)

const sourcePlanOptions = computed(() =>
  currentFamilyPlans.value.map(plan => ({
    label: `${plan.title} (${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(plan.price)})`,
    value: plan.id,
  }))
)

watch(() => form.value.family_id, () => { sourcePlanId.value = '' })

watch(sourcePlanId, (id) => {
  if (!id) return
  const source = currentFamilyPlans.value.find(p => p.id === id)
  if (!source) return
  applyPrefillToEmptyFields(source)
  toast.add({ title: 'Pola uzupełnione', description: 'Puste pola zostały uzupełnione z wybranego planu źródłowego.', color: 'success' })
})

onMounted(async () => {
  if (!vendorId) return
  try {
    const [familyList, plans] = await Promise.all([listVendorPlanFamilies(vendorId), getVendorHousePlans(vendorId)])
    families.value = familyList
    vendorPlans.value = plans
  } catch {
    families.value = []
    vendorPlans.value = []
  }
})

function handleMainImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      toast.add({ title: 'Plik za duży', description: `${file.name} przekracza 10 MB.`, color: 'warning' })
      continue
    }
    mainImages.value.push(file)
    mainPreviews.value.push(URL.createObjectURL(file))
  }
}

function removeMainImage(index: number) {
  URL.revokeObjectURL(mainPreviews.value[index]!)
  mainImages.value.splice(index, 1)
  mainPreviews.value.splice(index, 1)
}

function handleGalleryFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      toast.add({ title: 'Plik za duży', description: `${file.name} przekracza 10 MB.`, color: 'warning' })
      continue
    }
    stagedImages.value.push({ file, preview: URL.createObjectURL(file), description: '', category: 'wizualizacje' })
  }
}

function removeStagedImage(index: number) {
  URL.revokeObjectURL(stagedImages.value[index]!.preview)
  stagedImages.value.splice(index, 1)
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  for (const file of files) {
    if (file.size > 35 * 1024 * 1024) {
      toast.add({ title: 'Plik za duży', description: `${file.name} przekracza 35 MB.`, color: 'warning' })
      continue
    }
    stagedFiles.value.push(file)
  }
}

function removeStagedFile(index: number) {
  stagedFiles.value.splice(index, 1)
}

async function handleCreate() {
  if (!vendorId) {
    toast.add({ title: 'Brak vendorId', color: 'error' })
    return
  }
  if (!validate()) {
    activeTab.value = 'dane'
    toast.add({ title: 'Uzupełnij wymagane pola w zakładce Dane projektu', color: 'warning' })
    return
  }
  creating.value = true
  let createdId: string | null = null
  try {
    const created = await createVendorHousePlan(vendorId, toCreatePayload())
    createdId = created.id
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się utworzyć planu.', color: 'error' })
    creating.value = false
    return
  }

  // Uploady są niekrytyczne — błąd nie blokuje przejścia do edycji
  if (mainImages.value.length) {
    try {
      await uploadHousePlanImages(vendorId, createdId, mainImages.value)
    } catch {
      toast.add({ title: 'Ostrzeżenie', description: 'Nie udało się wgrać zdjęć głównych.', color: 'warning' })
    }
  }
  for (const img of stagedImages.value) {
    try {
      await uploadGalleryImage(vendorId, createdId, img.file, img.description || undefined, img.category)
    } catch {
      toast.add({ title: 'Ostrzeżenie', description: `Nie udało się wgrać ${img.file.name}.`, color: 'warning' })
    }
  }
  for (const file of stagedFiles.value) {
    try {
      await uploadFile(createdId, file)
    } catch {
      toast.add({ title: 'Ostrzeżenie', description: `Nie udało się wgrać ${file.name}.`, color: 'warning' })
    }
  }

  toast.add({ title: 'Plan utworzony', color: 'success' })
  creating.value = false
  await router.push(`/konto/sprzedawca/plan/${createdId}?vendorId=${vendorId}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
        size="lg"
        icon="i-lucide-save"
        :loading="creating"
        class="cursor-pointer"
        @click="handleCreate"
      >
        Zapisz plan
      </UButton>
    </div>

    <nav class="border-b border-default mb-8">
      <div class="flex gap-0">
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'dane' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default',
          ]"
          @click="activeTab = 'dane'"
        >
          Dane projektu
        </button>
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'galeria' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default',
          ]"
          @click="activeTab = 'galeria'"
        >
          Galeria
          <span
            v-if="stagedImages.length"
            class="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-xs font-semibold"
          >
            {{ stagedImages.length }}
          </span>
        </button>
        <button
          type="button"
          :class="[
            'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'pliki' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default hover:border-default',
          ]"
          @click="activeTab = 'pliki'"
        >
          Pliki
          <span
            v-if="stagedFiles.length"
            class="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-xs font-semibold"
          >
            {{ stagedFiles.length }}
          </span>
        </button>
      </div>
    </nav>

    <!-- Zakładka: Dane projektu -->
    <div v-show="activeTab === 'dane'" class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Lewa kolumna: zdjęcia główne + opis -->
      <div class="flex flex-col gap-8">
        <label class="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleMainImageSelect"
          >
          <div class="relative aspect-video rounded-xl border-2 border-dashed border-default overflow-hidden bg-muted/20 group">
            <img
              v-if="mainPreviews.length"
              :src="mainPreviews[0]"
              alt=""
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted pointer-events-none"
            >
              <UIcon
                name="i-lucide-image-plus"
                class="size-12"
              />
              <span class="text-sm font-medium">Kliknij, aby dodać zdjęcia</span>
              <span class="text-xs">JPG, PNG, WebP · maks. 10 MB</span>
            </div>
            <div
              v-if="mainPreviews.length"
              class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none"
            >
              <UIcon
                name="i-lucide-image-plus"
                class="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </label>

        <div
          v-if="mainPreviews.length"
          class="flex gap-2 overflow-x-auto pb-1"
        >
          <div
            v-for="(src, i) in mainPreviews"
            :key="src"
            class="relative shrink-0 w-20 h-16 rounded-lg overflow-hidden border border-default group/thumb"
          >
            <img
              :src="src"
              alt=""
              class="w-full h-full object-cover"
            >
            <button
              type="button"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
              @click.prevent="removeMainImage(i)"
            >
              <UIcon
                name="i-lucide-x"
                class="size-4 text-white"
              />
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold text-default mb-4">Opis projektu</h2>
          <UTextarea
            v-model="form.description"
            :rows="8"
            placeholder="Opisz projekt — styl, rozwiązania architektoniczne, przeznaczenie..."
          />
        </div>
      </div>

      <!-- Prawa kolumna: tytuł, cena, pola -->
      <div class="space-y-8">
        <div>
          <input
            v-model="form.title"
            type="text"
            placeholder="Nazwa projektu..."
            class="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted/40 text-default mb-1 leading-tight"
          >
          <p v-if="errors.title" class="text-xs text-error mb-2">{{ errors.title }}</p>

          <div v-if="families.length" class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-layers-2" class="size-4 text-muted shrink-0" />
            <USelect
              v-model="form.family_id"
              :items="familyOptions"
              value-key="value"
              label-key="label"
              size="xs"
              class="w-52"
            />
            <USelect
              v-if="form.family_id !== 'none'"
              v-model="sourcePlanId"
              :items="sourcePlanOptions"
              value-key="value"
              label-key="label"
              size="xs"
              class="w-52"
              placeholder="Seed z planu..."
            />
          </div>

          <div class="flex items-baseline gap-2">
            <input
              v-model="form.price"
              type="number"
              placeholder="0"
              class="text-3xl font-bold text-primary bg-transparent border-none outline-none placeholder:text-primary/30 w-36 leading-tight"
            >
            <span class="text-3xl font-bold text-primary">zł</span>
          </div>
          <p v-if="errors.price" class="text-xs text-error mt-1">{{ errors.price }}</p>
        </div>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Szczegóły projektu</h3>
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
            <p class="text-xs text-muted"><span class="text-error">*</span> Pola wymagane</p>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Charakterystyka budynku</h3>
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

    <!-- Zakładka: Galeria -->
    <div v-show="activeTab === 'galeria'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-default">Galeria wizualizacji</h2>
          <p class="text-sm text-muted mt-0.5">Zdjęcia zostaną przesłane po kliknięciu „Zapisz plan".</p>
        </div>
        <label class="cursor-pointer">
          <input type="file" accept="image/*" multiple class="hidden" @change="handleGalleryFileChange">
          <UButton as="span" icon="i-lucide-image-plus" size="sm">Dodaj zdjęcia</UButton>
        </label>
      </div>

      <div v-if="!stagedImages.length" class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
        <UIcon name="i-lucide-images" class="size-12 text-muted" />
        <div>
          <p class="text-default font-medium">Brak zdjęć</p>
          <p class="text-sm text-muted mt-1">Kliknij „Dodaj zdjęcia" żeby dodać wizualizacje.</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(img, index) in stagedImages"
          :key="img.preview"
          class="group relative rounded-xl border border-default overflow-hidden bg-muted"
        >
          <div class="aspect-video">
            <img :src="img.preview" :alt="img.description || 'Podgląd'" class="w-full h-full object-cover">
          </div>
          <button
            type="button"
            class="absolute top-2 right-2 size-7 rounded-full bg-red-500/85 hover:bg-red-500 text-white flex items-center justify-center shadow transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            @click="removeStagedImage(index)"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <div class="p-3 space-y-2 border-t border-default">
            <UInput v-model="img.description" size="xs" placeholder="Opis (opcjonalny)" />
            <USelect v-model="img.category" :items="categoryOptions" value-key="value" label-key="label" size="xs" />
          </div>
        </div>
      </div>
    </div>

    <!-- Zakładka: Pliki -->
    <div v-show="activeTab === 'pliki'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-default">Pliki dokumentacji</h2>
          <p class="text-sm text-muted mt-0.5">Pliki zostaną przesłane po kliknięciu „Zapisz plan".</p>
        </div>
        <label class="cursor-pointer">
          <input type="file" multiple class="hidden" @change="handleFileChange">
          <UButton as="span" icon="i-lucide-upload" size="sm">Wgraj pliki</UButton>
        </label>
      </div>

      <div v-if="!stagedFiles.length" class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
        <UIcon name="i-lucide-folder-open" class="size-12 text-muted" />
        <div>
          <p class="text-default font-medium">Brak plików</p>
          <p class="text-sm text-muted mt-1">Kliknij „Wgraj pliki" żeby dodać pliki dokumentacji.</p>
        </div>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(file, index) in stagedFiles"
          :key="`${file.name}-${index}`"
          class="group flex items-center gap-4 px-4 py-3 rounded-xl border border-default hover:bg-muted/50 transition-colors"
        >
          <UIcon :name="fileIcon(file.type)" :class="['size-8 shrink-0', fileIconColor(file.type)]" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-default truncate">{{ file.name }}</p>
            <p class="text-xs text-muted">{{ formatFileSize(file.size) }}</p>
          </div>
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-error hover:text-error/80"
            @click="removeStagedFile(index)"
          >
            <UIcon name="i-lucide-trash-2" class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
