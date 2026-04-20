<script setup lang="ts">
definePageMeta({ middleware: 'vendor-auth' })
import { createError, useAsyncData } from "#imports";
import { useHousePlanService } from "~/composables/services/useHousePlanService";
import { useVendorService } from "~/composables/services/useVendorService";
import { useVendorPlanForm } from "~/composables/useVendorPlanForm";
import type { AppHousePlan } from "~/types/house-plan";

const route = useRoute();
const toast = useToast();
const vendorId = route.query.vendorId as string;
const planId = route.params.id as string;

const { getHousePlan } = useHousePlanService();
const { updateVendorHousePlan, listVendorPlanFamilies, getVendorHousePlans } =
  useVendorService();

const {
  data: plan,
  error,
  refresh,
} = await useAsyncData(`vendor-plan-edit-${planId}`, () =>
  getHousePlan(planId),
);

if (error.value || !plan.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Projekt nie znaleziony",
    fatal: true,
  });
}

const {
  form,
  errors,
  roofLabel,
  dimensionsLabel,
  validate,
  toUpdatePayload,
  loadFromPlan,
  applyPrefillToEmptyFields,
} = useVendorPlanForm();

const families = ref<Array<{ id: string; name: string }>>([]);
const sourcePlanId = ref("");
const vendorPlans = ref<AppHousePlan[]>([]);

const familyOptions = computed(() => [
  { label: "Brak rodziny", value: "none" },
  ...families.value.map((f) => ({ label: f.name, value: f.id })),
]);

const currentFamilyPlans = computed(() =>
  vendorPlans.value.filter(
    (candidate) =>
      candidate.id !== planId && candidate.family?.id === form.value.family_id,
  ),
);

const sourcePlanOptions = computed(() =>
  currentFamilyPlans.value.map((candidate) => ({
    label: `${candidate.title} (${new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(candidate.price)})`,
    value: candidate.id,
  })),
);

watch(
  () => plan.value,
  (value) => {
    if (value) loadFromPlan(value);
  },
  { immediate: true },
);

watch(
  () => form.value.family_id,
  () => {
    sourcePlanId.value = "";
  },
);

watch(sourcePlanId, (id) => {
  if (!id) return;
  const source = currentFamilyPlans.value.find((p) => p.id === id);
  if (!source) return;
  applyPrefillToEmptyFields(source);
  toast.add({
    title: "Pola uzupełnione",
    description: "Puste pola zostały uzupełnione z wybranego planu źródłowego.",
    color: "success",
  });
});

onMounted(async () => {
  if (!vendorId) return;
  try {
    const [familyList, plans] = await Promise.all([
      listVendorPlanFamilies(vendorId),
      getVendorHousePlans(vendorId),
    ]);
    families.value = familyList;
    vendorPlans.value = plans;
  } catch {
    families.value = [];
    vendorPlans.value = [];
  }
});

const saving = ref(false);

async function handleSave() {
  if (!vendorId) {
    toast.add({ title: "Brak vendorId", color: "error" });
    return;
  }
  if (!validate()) {
    toast.add({ title: "Uzupełnij wymagane pola", color: "warning" });
    return;
  }

  saving.value = true;
  try {
    const updated = await updateVendorHousePlan(
      vendorId,
      planId,
      toUpdatePayload(),
    );
    plan.value = updated;
    loadFromPlan(updated);
    toast.add({ title: "Zapisano zmiany", color: "success" });
    await refresh();
  } catch {
    toast.add({
      title: "Błąd",
      description: "Nie udało się zapisać zmian.",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(price);
};
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
      <div class="flex flex-col gap-8">
        <PlanImageGallery
          :images="plan?.images ?? []"
          :thumbnail="plan?.thumbnail"
          mode="full"
        />

        <div class="prose dark:prose-invert max-w-none text-muted">
          <h2 class="text-xl font-semibold text-default mb-4">Opis projektu</h2>
          <UTextarea v-model="form.description" :rows="8" />
        </div>

        <PlanSketches :plan-id="planId" />
      </div>

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
              <p class="font-semibold text-default truncate">
                {{ plan.vendor.company_name }}
              </p>
              <p class="text-sm text-muted">
                {{ plan.vendor.first_name }} {{ plan.vendor.last_name }}
              </p>
            </div>
          </div>
        </UCard>

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
            <p
              v-if="form.family_id !== 'none' && !sourcePlanOptions.length"
              class="text-xs text-muted"
            >
              Brak innych planów w tej rodzinie do użycia jako źródło.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Szczegóły projektu</h3>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput
                v-model="form.house_area"
                type="number"
                placeholder="Powierzchnia użytkowa (m²)"
                :color="errors.house_area ? 'error' : 'neutral'"
              />
              <UInput
                v-model="form.boiler_room_area"
                type="number"
                placeholder="Powierzchnia kotłowni (m²)"
              />
              <UInput
                v-model="form.rooms"
                type="number"
                placeholder="Liczba pokoi"
                :color="errors.rooms ? 'error' : 'neutral'"
              />
              <UInput
                v-model="form.floors"
                type="number"
                placeholder="Liczba kondygnacji"
              />
              <UInput
                v-model="form.bathrooms_and_wc"
                type="number"
                placeholder="Łazienki i WC"
                :color="errors.bathrooms_and_wc ? 'error' : 'neutral'"
              />
            </div>
            <UInput
              v-model="form.plot_dimensions"
              placeholder="Min. wymiary działki"
              :color="errors.plot_dimensions ? 'error' : 'neutral'"
            />
            <UInput
              v-model="form.min_plot_dimensions_after_adaptation"
              placeholder="Wymiary po adaptacji"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Charakterystyka budynku</h3>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput v-model="form.house_type" placeholder="Typ domu" />
              <UInput
                v-model="form.architectural_style"
                placeholder="Styl architektoniczny"
              />
              <UInput
                v-model="form.energy_standard"
                placeholder="Standard energetyczny"
              />
              <UInput v-model="form.garage" placeholder="Garaż" />
              <UInput v-model="form.basement" placeholder="Piwnica" />
              <USelect
                v-model="form.fireplace"
                :items="[
                  { label: 'Tak', value: 'tak' },
                  { label: 'Nie', value: 'nie' },
                ]"
                value-key="value"
                label-key="label"
                placeholder="Kominek"
              />
              <USelect
                v-model="form.terrace"
                :items="[
                  { label: 'Tak', value: 'tak' },
                  { label: 'Nie', value: 'nie' },
                ]"
                value-key="value"
                label-key="label"
                placeholder="Taras"
              />
              <UInput v-model="form.roof_type" placeholder="Typ dachu" />
              <UInput
                v-model="form.roof_angle"
                type="number"
                placeholder="Kąt nachylenia dachu"
              />
              <UInput
                v-model="form.building_width"
                type="number"
                placeholder="Szerokość budynku"
              />
              <UInput
                v-model="form.building_length"
                type="number"
                placeholder="Długość budynku"
              />
              <UInput
                v-model="form.building_height"
                type="number"
                placeholder="Wysokość budynku"
              />
              <UInput
                v-model="form.building_footprint"
                type="number"
                placeholder="Powierzchnia zabudowy"
              />
              <UInput
                v-model="form.total_area"
                type="number"
                placeholder="Powierzchnia całkowita"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UInput
                :model-value="roofLabel ?? ''"
                disabled
                placeholder="Podgląd: Dach"
              />
              <UInput
                :model-value="dimensionsLabel ?? ''"
                disabled
                placeholder="Podgląd: Wymiary budynku"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
