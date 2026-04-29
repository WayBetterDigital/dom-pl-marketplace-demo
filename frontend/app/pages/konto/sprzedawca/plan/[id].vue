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

if (error.value || !plan.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

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

const saving = ref(false);

async function handleSave() {
  if (!vendorId) {
    toast.add({ title: 'Brak vendorId', color: 'error' })
    return
  }
  if (!validate()) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'warning' })
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
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <div class="mb-4 flex items-center justify-between gap-3">
      <UButton
        :to="`/konto/sprzedawca?id=${vendorId}`"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do panelu sprzedawcy
      </UButton>
      <UButton icon="i-lucide-save" :loading="saving" @click="handleSave">
        Zapisz zmiany
      </UButton>
    </div>

    <VendorPlanTabNav :plan-id="planId" :vendor-id="vendorId" class="mb-8" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Lewa kolumna: galeria główna + opis + szkice -->
      <div class="flex flex-col gap-8">
        <PlanImageGallery
          :images="plan?.images ?? []"
          :thumbnail="plan?.thumbnail"
          mode="full"
        />

        <div>
          <h2 class="text-xl font-semibold text-default mb-4">Opis projektu</h2>
          <UTextarea
            v-model="form.description"
            :rows="8"
            class="w-full"
          />
        </div>

        <PlanSketches :plan-id="planId" />
      </div>

      <!-- Prawa kolumna: tytuł, cena, pola -->
      <div class="space-y-8">
        <div>
          <UInput
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
  </div>
</template>
