<script setup lang="ts">
import { useHousePlanService } from '~/composables/services/useHousePlanService'

const housePlanService = useHousePlanService()

const { data: featuredData } = await useAsyncData('featured-house-plans', () =>
  housePlanService.listHousePlans({ limit: 6 })
)
const featuredPlans = computed(() => featuredData.value?.data ?? [])

const { data: frequentlySelectedData } = await useAsyncData(
  'frequently-selected-house-plans',
  () => housePlanService.listHousePlans({ limit: 10 })
)
const frequentlySelectedPlans = computed(
  () => frequentlySelectedData.value?.data ?? []
)

const { data: popularData } = await useAsyncData('popular-house-plans', () =>
  housePlanService.listHousePlans({ limit: 10 })
)
const popularPlans = computed(() => popularData.value?.data ?? [])
</script>

<template>
  <div>
    <HeroBanner />

    <CategoryCarousel />

    <FeaturedPlansSection :plans="featuredPlans" />

    <StyleBanner />

    <CardCarousel
      :items="frequentlySelectedPlans"
      title="Najczęściej wybierane projekty"
    >
      <template #default="{ item, index }">
        <HousePlanCard
          :plan="item"
          :hot-promo="index % 2 === 0"
          class="snap-start shrink-0 w-[279px]"
        />
      </template>
    </CardCarousel>

    <CardCarousel
      :items="popularPlans"
      title="Popularne projekty"
    >
      <template #default="{ item, index }">
        <HousePlanCard
          :plan="item"
          :hot-promo="index % 2 === 0"
          class="snap-start shrink-0 w-[279px]"
        />
      </template>
    </CardCarousel>

    <SearchByCategory class="mt-10" />
  </div>
</template>
