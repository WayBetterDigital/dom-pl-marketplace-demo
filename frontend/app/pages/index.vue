<script setup lang="ts">
import { useHousePlanService } from '~/composables/services/useHousePlanService'

const housePlanService = useHousePlanService()

const { data } = await useAsyncData('featured-house-plans', () =>
  housePlanService.listHousePlans({ limit: 6 })
)

const featuredPlans = computed(() => data.value?.data ?? [])

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
      :items="popularPlans"
      title="Najczęściej wybierane projekty"
    >
      <template #default="{ item, index }">
        <HousePlanCard
          :plan="item"
          :hot-promo="index % 2 === 0"
          class="snap-start shrink-0 w-[340px]"
        />
      </template>
    </CardCarousel>
  </div>
</template>
