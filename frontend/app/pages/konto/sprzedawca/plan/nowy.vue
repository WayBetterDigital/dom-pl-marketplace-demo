<script setup lang="ts">
definePageMeta({ middleware: 'vendor-auth' })
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
        Zapisz i przejdź do edycji
      </UButton>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Lewa kolumna: zdjęcia + opis -->
      <div class="flex flex-col gap-8">

        <!-- Strefa uploadu zdjęć – wygląda jak galeria -->
        <label class="cursor-pointer block">
          <input type="file" accept="image/*" multiple class="hidden" @change="handleImageSelect">
          <div class="relative aspect-video rounded-xl border-2 border-dashed border-default overflow-hidden bg-muted/20 group">
            <img
              v-if="imagePreviews.length"
              :src="imagePreviews[0]"
              alt=""
              class="w-full h-full object-cover"
            >
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted pointer-events-none">
              <UIcon name="i-lucide-image-plus" class="size-12" />
              <span class="text-sm font-medium">Kliknij, aby dodać zdjęcia</span>
              <span class="text-xs">JPG, PNG, WebP · maks. 10 MB</span>
            </div>
            <div
              v-if="imagePreviews.length"
              class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none"
            >
              <UIcon name="i-lucide-image-plus" class="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </label>

        <!-- Pasek miniaturek -->
        <div v-if="imagePreviews.length" class="flex gap-2 overflow-x-auto pb-1">
          <div
            v-for="(src, i) in imagePreviews"
            :key="src"
            class="relative shrink-0 w-20 h-16 rounded-lg overflow-hidden border border-default group/thumb"
          >
            <img :src="src" alt="" class="w-full h-full object-cover">
            <button
              type="button"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
              @click.prevent="removeSelectedImage(i)"
            >
              <UIcon name="i-lucide-x" class="size-4 text-white" />
            </button>
          </div>
        </div>

        <!-- Opis projektu -->
        <div>
          <h2 class="text-xl font-semibold text-default mb-4">Opis projektu</h2>
          <UTextarea v-model="form.description" :rows="8" placeholder="Opisz projekt — styl, rozwiązania architektoniczne, przeznaczenie..." />
        </div>

        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          title="Galeria i pliki po utworzeniu"
          description="Po pierwszym zapisie przejdziesz do pełnego widoku edycji, gdzie dodasz więcej zdjęć i plików dokumentacji."
        />
      </div>

      <!-- Prawa kolumna: szczegóły – układ taki sam jak widok produktu -->
      <div class="space-y-8">

        <!-- Tytuł i cena – wyglądają jak na stronie produktu -->
        <div>
          <input
            v-model="form.title"
            type="text"
            placeholder="Nazwa projektu..."
            class="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted/40 text-default mb-1 leading-tight"
          >
          <p v-if="errors.title" class="text-xs text-error mb-2">{{ errors.title }}</p>

          <!-- Rodzina (opcjonalna) -->
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

        <!-- Szczegóły projektu – takie same wiersze jak na stronie produktu -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Szczegóły projektu</h3>
          </template>

          <div class="space-y-0">
            <!-- Powierzchnia użytkowa * -->
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

            <!-- Powierzchnia kotłowni -->
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

            <!-- Liczba pokoi * -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-door-open" class="size-5 shrink-0" />
                <span class="text-sm">Liczba pokoi <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.rooms" type="number" size="xs" :color="errors.rooms ? 'error' : 'neutral'" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>

            <!-- Liczba kondygnacji -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-layers" class="size-5 shrink-0" />
                <span class="text-sm">Liczba kondygnacji</span>
              </div>
              <UInput v-model="form.floors" type="number" size="xs" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>

            <!-- Łazienki i WC * -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-bath" class="size-5 shrink-0" />
                <span class="text-sm">Łazienki i WC <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.bathrooms_and_wc" type="number" size="xs" :color="errors.bathrooms_and_wc ? 'error' : 'neutral'" class="w-20 [&_input]:text-right" placeholder="—" />
            </div>

            <!-- Min. wymiary działki * -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-ruler" class="size-5 shrink-0" />
                <span class="text-sm">Min. wymiary działki <span class="text-error">*</span></span>
              </div>
              <UInput v-model="form.plot_dimensions" size="xs" :color="errors.plot_dimensions ? 'error' : 'neutral'" class="w-28 [&_input]:text-right" placeholder="np. 20×30" />
            </div>

            <!-- Wymiary po adaptacji -->
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

        <!-- Charakterystyka budynku -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Charakterystyka budynku</h3>
          </template>

          <div class="space-y-0">
            <!-- Typ domu -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-home" class="size-5 shrink-0" />
                <span class="text-sm">Typ domu</span>
              </div>
              <USelect
                v-model="form.house_type"
                :items="[{ label: 'Jednorodzinny', value: 'jednorodzinny' }, { label: 'Bliźniak', value: 'bliźniak' }, { label: 'Rekreacyjny', value: 'rekreacyjny' }]"
                value-key="value" label-key="label" size="xs" class="w-44" placeholder="—"
              />
            </div>

            <!-- Styl architektoniczny -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-pen-tool" class="size-5 shrink-0" />
                <span class="text-sm">Styl architektoniczny</span>
              </div>
              <USelect
                v-model="form.architectural_style"
                :items="[{ label: 'Tradycyjny', value: 'tradycyjny' }, { label: 'Nowoczesny', value: 'nowoczesny' }, { label: 'Klasyczny', value: 'klasyczny' }, { label: 'Skandynawski', value: 'skandynawski' }]"
                value-key="value" label-key="label" size="xs" class="w-44" placeholder="—"
              />
            </div>

            <!-- Standard energetyczny -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-zap" class="size-5 shrink-0" />
                <span class="text-sm">Standard energetyczny</span>
              </div>
              <USelect
                v-model="form.energy_standard"
                :items="[{ label: 'Standard', value: 'standard' }, { label: 'Energooszczędny', value: 'energooszczędny' }, { label: 'Pasywny', value: 'pasywny' }]"
                value-key="value" label-key="label" size="xs" class="w-44" placeholder="—"
              />
            </div>

            <!-- Garaż -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-car" class="size-5 shrink-0" />
                <span class="text-sm">Garaż</span>
              </div>
              <USelect
                v-model="form.garage"
                :items="[{ label: 'Brak', value: 'brak' }, { label: 'Jednostanowiskowy', value: 'jednostanowiskowy' }, { label: 'Dwustanowiskowy', value: 'dwustanowiskowy' }, { label: 'Trzystanowiskowy', value: 'trzystanowiskowy' }]"
                value-key="value" label-key="label" size="xs" class="w-44" placeholder="—"
              />
            </div>

            <!-- Piwnica -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-arrow-down-to-line" class="size-5 shrink-0" />
                <span class="text-sm">Piwnica</span>
              </div>
              <USelect
                v-model="form.basement"
                :items="[{ label: 'Brak', value: 'brak' }, { label: 'Częściowa', value: 'częściowa' }, { label: 'Pełna', value: 'pełna' }]"
                value-key="value" label-key="label" size="xs" class="w-44" placeholder="—"
              />
            </div>

            <!-- Kominek -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-flame" class="size-5 shrink-0" />
                <span class="text-sm">Kominek</span>
              </div>
              <USelect
                v-model="form.fireplace"
                :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]"
                value-key="value" label-key="label" size="xs" class="w-28" placeholder="—"
              />
            </div>

            <!-- Taras -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-sun" class="size-5 shrink-0" />
                <span class="text-sm">Taras</span>
              </div>
              <USelect
                v-model="form.terrace"
                :items="[{ label: 'Tak', value: 'tak' }, { label: 'Nie', value: 'nie' }]"
                value-key="value" label-key="label" size="xs" class="w-28" placeholder="—"
              />
            </div>

            <!-- Dach -->
            <div class="flex items-center justify-between py-2.5 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-triangle" class="size-5 shrink-0" />
                <span class="text-sm">Dach</span>
              </div>
              <div class="flex items-center gap-1.5">
                <USelect
                  v-model="form.roof_type"
                  :items="[{ label: 'Dwuspadowy', value: 'dwuspadowy' }, { label: 'Czterospadowy', value: 'czterospadowy' }, { label: 'Płaski', value: 'płaski' }, { label: 'Mansardowy', value: 'mansardowy' }, { label: 'Jednospadowy', value: 'jednospadowy' }]"
                  value-key="value" label-key="label" size="xs" class="w-36" placeholder="Typ"
                />
                <UInput v-model="form.roof_angle" type="number" size="xs" class="w-16 [&_input]:text-right" placeholder="°" />
              </div>
            </div>

            <!-- Wymiary budynku -->
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

            <!-- Wysokość budynku -->
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

            <!-- Powierzchnia zabudowy -->
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

            <!-- Powierzchnia całkowita -->
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
