<script setup lang="ts">
import { useRoute, useAsyncData, createError, useRouter } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import { useCartService } from '~/composables/services/useCartService'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const housePlanService = useHousePlanService()
const cartService = useCartService()

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

const isAddingToCart = ref(false)

const handleAddToCart = async () => {
  if (!plan.value?.variantId) {
    console.error('No variant ID found for this house plan.')
    return
  }

  isAddingToCart.value = true
  try {
    await cartService.addToCart(plan.value.variantId)
    router.push('/koszyk')
  } catch (err) {
    console.error('Failed to add to cart:', err)
  } finally {
    isAddingToCart.value = false
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(price)
}

const { data: variants } = await useAsyncData(
  `house-plan-variants-${id}`,
  () => plan.value?.family
    ? housePlanService.listHousePlans({ familyId: plan.value.family.id, limit: 10 })
    : Promise.resolve(null),
  { lazy: true }
)

const { data: similar } = await useAsyncData(
  `house-plan-similar-${id}`,
  () => housePlanService.listHousePlans({
    floors: plan.value?.floors ?? undefined,
    minArea: plan.value?.houseArea ? plan.value.houseArea - 30 : undefined,
    maxArea: plan.value?.houseArea ? plan.value.houseArea + 30 : undefined,
    limit: 5
  }),
  { lazy: true }
)

const { data: others } = await useAsyncData(
  `house-plan-others-${id}`,
  () => housePlanService.listHousePlans({ limit: 5 }),
  { lazy: true }
)

const variantPlans = computed(() =>
  variants.value?.data.filter(p => p.id !== id).slice(0, 8) ?? []
)

const similarPlans = computed(() =>
  similar.value?.data.filter(p => p.id !== id).slice(0, 4) ?? []
)

const otherPlans = computed(() =>
  others.value?.data.filter(p => p.id !== id).slice(0, 4) ?? []
)

const roofLabel = computed(() => {
  const parts = []
  if (plan.value?.roofType) parts.push(plan.value.roofType)
  if (plan.value?.roofAngle) parts.push(`${plan.value.roofAngle}°`)
  return parts.join(', ') || null
})

const dimensionsLabel = computed(() => {
  const { buildingWidth, buildingLength } = plan.value ?? {}
  if (buildingWidth && buildingLength) return `${buildingWidth} × ${buildingLength} m`
  return null
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Back Button -->
    <div class="mb-6">
      <UButton
        to="/produkty"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do projektów
      </UButton>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Left Column: Image and Description -->
      <div class="flex flex-col gap-8">
        <PlanImageGallery
          :images="plan?.images ?? []"
          :thumbnail="plan?.thumbnail"
          mode="full"
        />

        <div
          v-if="plan?.description"
          class="prose dark:prose-invert max-w-none text-muted"
        >
          <h2 class="text-xl font-semibold text-default mb-4">
            Opis projektu
          </h2>
          <p class="whitespace-pre-line">
            {{ plan.description }}
          </p>
        </div>

        <section class="flex flex-col justify-end mt-auto">
          <!-- Warianty projektu -->
          <HousePlanCarousel
            v-if="variantPlans.length"
            title="Warianty projektu"
            :plans="variantPlans"
          />
          <!-- Podobne projekty -->
          <HousePlanCarousel
            v-if="similarPlans.length"
            title="Podobne projekty"
            :plans="similarPlans"
          />
          <HousePlanCarousel
            v-else-if="otherPlans.length && !variantPlans.length"
            title="Inne projekty"
            :plans="otherPlans"
          />
        </section>
      </div>

      <!-- Right Column: Details and Action -->
      <div class="space-y-8">
        <div>
          <h1 class="text-3xl font-bold text-default mb-2">
            {{ plan?.title }}
          </h1>
          <div
            v-if="plan?.family"
            class="flex items-center gap-1.5 mb-2"
          >
            <UIcon
              name="i-lucide-layers-2"
              class="size-4 text-muted"
            />
            <span class="text-sm text-muted">{{ plan.family.name }}</span>
          </div>
          <p class="text-3xl font-bold text-primary">
            {{ formatPrice(plan?.price ?? 0) }}
          </p>
        </div>

        <!-- Vendor Card -->
        <UCard v-if="plan?.vendor">
          <template #header>
            <h3 class="text-lg font-semibold">
              Sprzedawca
            </h3>
          </template>

          <div class="flex items-start gap-4">
            <UAvatar
              :alt="plan.vendor.company_name"
              size="lg"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-default truncate">
                {{ plan.vendor.company_name }}
              </p>
              <p class="text-sm text-muted">
                {{ plan.vendor.first_name }} {{ plan.vendor.last_name }}
              </p>
              <div class="flex items-center gap-3 mt-2">
                <div
                  v-if="plan.vendor.average_rating"
                  class="flex items-center gap-1 text-sm text-muted"
                >
                  <UIcon
                    name="i-lucide-star"
                    class="size-4 text-yellow-500"
                  />
                  <span>{{ plan.vendor.average_rating.toFixed(1) }}</span>
                </div>
                <div class="flex items-center gap-1 text-sm text-muted">
                  <UIcon name="i-lucide-layout-grid" class="size-4" />
                  <span>{{ plan.vendor.house_plans_count }} {{ plan.vendor.house_plans_count === 1 ? 'projekt' : 'projektów' }}</span>
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <UButton
              :to="`/vendorzy/${plan.vendor.id}`"
              variant="outline"
              color="neutral"
              icon="i-lucide-store"
              block
            >
              Zobacz profil sprzedawcy
            </UButton>
          </template>
        </UCard>

        <!-- Podstawowe parametry -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Szczegóły projektu
            </h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-maximize" class="size-5" />
                <span>Powierzchnia użytkowa</span>
              </div>
              <span class="font-medium text-default">{{ plan?.houseArea }} m²</span>
            </div>

            <div v-if="plan?.boilerRoomArea" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-thermometer" class="size-5" />
                <span>Powierzchnia kotłowni</span>
              </div>
              <span class="font-medium text-default">{{ plan?.boilerRoomArea }} m²</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-door-open" class="size-5" />
                <span>Liczba pokoi</span>
              </div>
              <span class="font-medium text-default">{{ plan?.rooms }}</span>
            </div>

            <div v-if="plan?.floors" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-layers" class="size-5" />
                <span>Liczba kondygnacji</span>
              </div>
              <span class="font-medium text-default">{{ plan?.floors }}</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-bath" class="size-5" />
                <span>Łazienki i WC</span>
              </div>
              <span class="font-medium text-default">{{ plan?.bathroomsAndWc }}</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon
                  name="i-lucide-ruler"
                  class="size-5"
                />
                <span>Min. wymiary działki</span>
              </div>
              <span class="font-medium text-default">{{ plan?.plotDimensions }}</span>
            </div>

            <div
              v-if="plan?.minPlotDimensionsAfterAdaptation"
              class="flex items-center justify-between py-2 border-b border-default last:border-0"
            >
              <div class="flex items-center gap-2 text-muted">
                <UIcon
                  name="i-lucide-ruler"
                  class="size-5"
                />
                <span>Wymiary po adaptacji</span>
              </div>
              <span class="font-medium text-default">{{ plan?.minPlotDimensionsAfterAdaptation }}</span>
            </div>
          </div>

          <template #footer>
            <UButton
              block
              size="lg"
              icon="i-lucide-shopping-cart"
              :loading="isAddingToCart"
              class="cursor-pointer"
              @click="handleAddToCart"
            >
              Kup projekt
            </UButton>
          </template>
        </UCard>

        <!-- Charakterystyka budynku -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Charakterystyka budynku
            </h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="plan?.houseType"
              class="flex items-center justify-between py-2 border-b border-default last:border-0"
            >
              <div class="flex items-center gap-2 text-muted">
                <UIcon
                  name="i-lucide-home"
                  class="size-5"
                />
                <span>Typ domu</span>
              </div>
              <span class="font-medium text-default capitalize">{{ plan.houseType }}</span>
            </div>

            <div v-if="plan?.architecturalStyle" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-pen-tool" class="size-5" />
                <span>Styl architektoniczny</span>
              </div>
              <span class="font-medium text-default capitalize">{{ plan.architecturalStyle }}</span>
            </div>

            <div v-if="plan?.energyStandard" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-zap" class="size-5" />
                <span>Standard energetyczny</span>
              </div>
              <span class="font-medium text-default capitalize">{{ plan.energyStandard }}</span>
            </div>

            <div v-if="plan?.garage" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-car" class="size-5" />
                <span>Garaż</span>
              </div>
              <span class="font-medium text-default capitalize">{{ plan.garage }}</span>
            </div>

            <div v-if="plan?.basement" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-arrow-down-to-line" class="size-5" />
                <span>Piwnica</span>
              </div>
              <span class="font-medium text-default capitalize">{{ plan.basement }}</span>
            </div>

            <div v-if="plan?.fireplace !== null" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-flame" class="size-5" />
                <span>Kominek</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon
                  :name="plan?.fireplace ? 'i-lucide-check' : 'i-lucide-x'"
                  :class="plan?.fireplace ? 'text-green-500' : 'text-muted'"
                  class="size-5"
                />
                <span class="font-medium text-default">{{ plan?.fireplace ? 'Tak' : 'Nie' }}</span>
              </div>
            </div>

            <div v-if="plan?.terrace !== null" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-sun" class="size-5" />
                <span>Taras</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon
                  :name="plan?.terrace ? 'i-lucide-check' : 'i-lucide-x'"
                  :class="plan?.terrace ? 'text-green-500' : 'text-muted'"
                  class="size-5"
                />
                <span class="font-medium text-default">{{ plan?.terrace ? 'Tak' : 'Nie' }}</span>
              </div>
            </div>

            <div v-if="roofLabel" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-triangle" class="size-5" />
                <span>Dach</span>
              </div>
              <span class="font-medium text-default capitalize">{{ roofLabel }}</span>
            </div>

            <div v-if="dimensionsLabel" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-move-horizontal" class="size-5" />
                <span>Wymiary budynku</span>
              </div>
              <span class="font-medium text-default">{{ dimensionsLabel }}</span>
            </div>

            <div v-if="plan?.buildingHeight" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-move-vertical" class="size-5" />
                <span>Wysokość budynku</span>
              </div>
              <span class="font-medium text-default">{{ plan.buildingHeight }} m</span>
            </div>

            <div v-if="plan?.buildingFootprint" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-square" class="size-5" />
                <span>Powierzchnia zabudowy</span>
              </div>
              <span class="font-medium text-default">{{ plan.buildingFootprint }} m²</span>
            </div>

            <div v-if="plan?.totalArea" class="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div class="flex items-center gap-2 text-muted">
                <UIcon name="i-lucide-layout" class="size-5" />
                <span>Powierzchnia całkowita</span>
              </div>
              <span class="font-medium text-default">{{ plan.totalArea }} m²</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
