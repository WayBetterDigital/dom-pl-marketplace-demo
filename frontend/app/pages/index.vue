<script setup lang="ts">
import { useHousePlanService } from '~/composables/services/useHousePlanService'

const housePlanService = useHousePlanService()

const { data } = await useAsyncData('featured-house-plans', () =>
  housePlanService.listHousePlans({ limit: 6 })
)

const featuredPlans = computed(() => data.value?.data ?? [])
</script>

<template>
  <div>
    <HeroBanner />

    <CategoryCarousel />

    <FeaturedPlansSection :plans="featuredPlans" />
  </div>
</template>
