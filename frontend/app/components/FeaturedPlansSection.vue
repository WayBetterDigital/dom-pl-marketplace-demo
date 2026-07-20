<script setup lang="ts">
import type { AppHousePlan } from '~/types/house-plan'

defineProps<{
  plans: AppHousePlan[]
}>()

const promoIndexes = [0, 1, 4, 5]
</script>

<template>
  <section class="py-10">
    <div class="flex flex-col lg:flex-row gap-6">
      <aside
        class="w-full xmd:w-[280px] lg:mr-2 3xl:w-[360px] 3xl:mr-4 shrink-0 flex flex-col gap-6 order-2 lg:order-1"
      >
        <PromoInfoCard />
        <CashbackAdCard />
      </aside>

      <!-- Projects -->
      <div class="flex-1 min-w-0 order-1 lg:order-2">
        <h2 class="text-[24px] leading-10 font-bold text-brand-blue-700 mb-6">
          Polecane projekty domów
        </h2>

        <div
          class="flex gap-5 overflow-x-auto thin-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 xl:grid-cols-3"
        >
          <HousePlanCard
            v-for="(plan, index) in plans"
            :key="plan.id"
            :plan="plan"
            :hot-promo="promoIndexes.includes(index)"
            class="shrink-0 w-[279px] sm:w-auto"
          />
        </div>

        <UButton
          to="/produkty"
          block
          class="mt-9 mb-15 rounded-[10px] border-2 border-brand-green-500 bg-transparent py-3 text-center text-[14px] font-semibold leading-6 text-brand-green-500 hover:bg-brand-green-500/5"
        >
          Zobacz więcej polecanych projektów domów
        </UButton>
      </div>
    </div>
  </section>
</template>
