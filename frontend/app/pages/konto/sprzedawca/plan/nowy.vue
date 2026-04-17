<script setup lang="ts">
import { useVendorService } from '~/composables/services/useVendorService'
import { useVendorPlanForm } from '~/composables/useVendorPlanForm'
import type { AppHousePlan } from '~/types/house-plan'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const vendorId = route.query.vendorId as string

const {
  createVendorHousePlan,
  uploadHousePlanImages,
  listVendorPlanFamilies,
  getVendorHousePlans,
} = useVendorService()

const {
  form,
  errors,
  roofLabel,
  dimensionsLabel,
  validate,
  toCreatePayload,
  applyPrefillToEmptyFields,
} = useVendorPlanForm()

const creating = ref(false)
const selectedImages = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const families = ref<Array<{ id: string, name: string }>>([])
const sourcePlanId = ref('')
const vendorPlans = ref<AppHousePlan[]>([])

const familyOptions = computed(() => [
  { label: 'Brak rodziny', value: 'none' },
  ...families.value.map(f => ({ label: f.name, value: f.id })),
])

const currentFamilyPlans = computed(() =>
  vendorPlans.value.filter(plan => plan.family?.id === form.value.family_id)
)

const sourcePlanOptions = computed(() =>
  currentFamilyPlans.value.map(plan => ({
    label: `${plan.title} (${new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(plan.price)})`,
    value: plan.id
  }))
)

watch(() => form.value.family_id, () => {
  sourcePlanId.value = ''
})

watch(sourcePlanId, (id) => {
  if (!id) return
  const source = currentFamilyPlans.value.find(p => p.id === id)
  if (!source) return
  applyPrefillToEmptyFields(source)
  toast.add({
    title: 'Pola uzupełnione',
    description: 'Puste pola zostały uzupełnione z wybranego planu źródłowego.',
    color: 'success',
  })
})

onMounted(async () => {
  if (!vendorId) return
  try {
    const [familyList, plans] = await Promise.all([
      listVendorPlanFamilies(vendorId),
      getVendorHousePlans(vendorId),
    ])
    families.value = familyList
    vendorPlans.value = plans
  } catch {
    families.value = []
    vendorPlans.value = []
  }
})

function handleImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  const MAX_SIZE = 10 * 1024 * 1024
  const valid = files.filter(f => f.size <= MAX_SIZE)
  valid.forEach((f) => {
    selectedImages.value.push(f)
    imagePreviews.value.push(URL.createObjectURL(f))
  })
  input.value = ''
}

function removeSelectedImage(index: number) {
  URL.revokeObjectURL(imagePreviews.value[index]!)
  selectedImages.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

async function handleCreate() {
  if (!vendorId) {
    toast.add({ title: 'Brak vendorId', color: 'error' })
    return
  }
  if (!validate()) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'warning' })
    return
  }
  creating.value = true
  try {
    const created = await createVendorHousePlan(vendorId, toCreatePayload())
    if (selectedImages.value.length) {
      await uploadHousePlanImages(vendorId, created.id, selectedImages.value)
    }
    toast.add({ title: 'Plan utworzony', color: 'success' })
    await router.push(`/konto/sprzedawca/plan/${created.id}?vendorId=${vendorId}`)
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się utworzyć planu.', color: 'error' })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <div class="mb-4">
      <UButton
        :to="`/konto/sprzedawca?id=${vendorId}`"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do panelu sprzedawcy
      </UButton>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div class="flex flex-col gap-8">
        <div class="aspect-video rounded-xl border border-default overflow-hidden bg-muted/40 flex items-center justify-center">
          <div v-if="imagePreviews.length" class="w-full h-full">
            <img :src="imagePreviews[0]" alt="" class="w-full h-full object-cover">
          </div>
          <div v-else class="text-sm text-muted">
            Podgląd zdjęcia głównego
          </div>
        </div>

        <label class="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleImageSelect"
          >
          <UButton
            as="span"
            icon="i-lucide-image-plus"
            variant="outline"
          >
            Dodaj zdjęcia
          </UButton>
        </label>

        <div v-if="imagePreviews.length" class="grid grid-cols-3 gap-2">
          <div v-for="(src, i) in imagePreviews" :key="src" class="relative rounded-lg overflow-hidden border border-default">
            <img :src="src" alt="" class="w-full h-20 object-cover">
            <button
              type="button"
              class="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white flex items-center justify-center"
              @click="removeSelectedImage(i)"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </div>
        </div>

        <div class="prose dark:prose-invert max-w-none text-muted">
          <h2 class="text-xl font-semibold text-default mb-4">
            Opis projektu
          </h2>
          <UTextarea v-model="form.description" :rows="6" />
        </div>

        <UAlert
          color="neutral"
          variant="soft"
          title="Galeria i pliki po utworzeniu"
          description="Po pierwszym zapisie przejdziesz do pełnego widoku edycji z zakładkami Galeria i Pliki."
        />
      </div>

      <div class="space-y-8">
        <div>
          <UInput v-model="form.title" size="xl" placeholder="Nazwa projektu" class="mb-2" :color="errors.title ? 'error' : 'neutral'" />
          <UInput v-model="form.price" type="number" size="xl" placeholder="Cena (PLN)" :color="errors.price ? 'error' : 'neutral'" />
        </div>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Rodzina i seed</h3>
          </template>
          <div class="space-y-3">
            <USelect
              v-model="form.family_id"
              :items="familyOptions"
              value-key="value"
              label-key="label"
              placeholder="Wybierz rodzinę"
            />

            <USelect
              v-if="form.family_id !== 'none'"
              v-model="sourcePlanId"
              :items="sourcePlanOptions"
              value-key="value"
              label-key="label"
              placeholder="Seed: wybierz plan źródłowy"
            />
            <p v-if="form.family_id !== 'none' && !sourcePlanOptions.length" class="text-xs text-muted">
              Brak planów w tej rodzinie do użycia jako źródło.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Szczegóły projektu</h3>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput v-model="form.house_area" type="number" placeholder="Powierzchnia użytkowa (m²)" :color="errors.house_area ? 'error' : 'neutral'" />
              <UInput v-model="form.boiler_room_area" type="number" placeholder="Powierzchnia kotłowni (m²)" />
              <UInput v-model="form.rooms" type="number" placeholder="Liczba pokoi" :color="errors.rooms ? 'error' : 'neutral'" />
              <UInput v-model="form.bathrooms_and_wc" type="number" placeholder="Łazienki i WC" :color="errors.bathrooms_and_wc ? 'error' : 'neutral'" />
            </div>
            <UInput v-model="form.plot_dimensions" placeholder="Min. wymiary działki" :color="errors.plot_dimensions ? 'error' : 'neutral'" />
            <UInput v-model="form.min_plot_dimensions_after_adaptation" placeholder="Wymiary po adaptacji" />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Charakterystyka budynku</h3>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput v-model="form.floors" type="number" placeholder="Liczba kondygnacji" />
              <UInput v-model="form.house_type" placeholder="Typ domu" />
              <UInput v-model="form.building_width" type="number" placeholder="Szerokość budynku (m)" />
              <UInput v-model="form.building_length" type="number" placeholder="Długość budynku (m)" />
              <UInput v-model="form.building_height" type="number" placeholder="Wysokość budynku (m)" />
              <UInput v-model="form.building_footprint" type="number" placeholder="Powierzchnia zabudowy (m²)" />
              <UInput v-model="form.total_area" type="number" placeholder="Powierzchnia całkowita (m²)" />
              <UInput v-model="form.roof_type" placeholder="Typ dachu" />
              <UInput v-model="form.roof_angle" type="number" placeholder="Kąt dachu" />
              <UInput v-model="form.garage" placeholder="Garaż" />
              <UInput v-model="form.basement" placeholder="Piwnica" />
              <UInput v-model="form.architectural_style" placeholder="Styl architektoniczny" />
              <UInput v-model="form.energy_standard" placeholder="Standard energetyczny" />
              <USelect
                v-model="form.fireplace"
                :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]"
                value-key="value"
                label-key="label"
                placeholder="Kominek"
              />
              <USelect
                v-model="form.terrace"
                :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]"
                value-key="value"
                label-key="label"
                placeholder="Taras"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput :model-value="roofLabel ?? ''" disabled placeholder="Podgląd etykiety dachu" />
              <UInput :model-value="dimensionsLabel ?? ''" disabled placeholder="Podgląd wymiarów budynku" />
            </div>
          </div>

          <template #footer>
            <UButton
              block
              size="lg"
              icon="i-lucide-save"
              :loading="creating"
              class="cursor-pointer"
              @click="handleCreate"
            >
              Zapisz i przejdź do pełnej edycji
            </UButton>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>
