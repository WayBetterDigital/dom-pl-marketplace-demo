<script setup lang="ts">
import type { AppHousePlan } from '~/types/house-plan'

defineProps<{
  plans: AppHousePlan[]
}>()

const benefits = [
  'Kompletna dokumentacja techniczna',
  '100% Zgodności z WT 2026',
  'Bezproblemowa Adaptacja'
]

const promoIndexes = [0, 1, 4, 5]
</script>

<template>
  <section class="px-4 md:px-[137px] py-10">
    <div class="flex flex-col lg:flex-row gap-6">
      <aside class="w-full lg:w-[285px] shrink-0 flex flex-col gap-5">
        <!-- first add -->
        <div class="rounded-[10px] border-2 border-brand-green-500 bg-white py-10 px-6">
          <h3 class="text-[24px] leading-8 text-brand-blue-700 mb-4">
            <span class="block font-bold mb-1">Gotowe projekty domów</span>
            <span class="block">znajdź wymarzony projekt</span>
          </h3>

          <p class="text-[14px] font-semibold leading-6 text-brand-blue-700 mb-4">
            Planujesz budowę i szukasz idealnego miejsca do życia? Nasza
            ogólnopolska platforma to nowoczesna baza, w której znajdziesz
            gotowe projekty domów stworzone przez najlepszych architektów w
            kraju.
          </p>
          <p class="text-[14px] leading-6 font-normal text-brand-blue-700 mb-[26px]">
            Kupując projekt domu online za pośrednictwem naszego serwisu,
            zyskujesz pełne wsparcie na każdym etapie przedbudowlanym. Naszym
            celem jest uproszczenie formalności do minimum.
          </p>

          <ul class="flex flex-col gap-3 mb-10">
            <li
              v-for="benefit in benefits"
              :key="benefit"
              class="flex items-center gap-2 text-[14px] leading-6 font-semibold text-brand-blue-700"
            >
              <UIcon
                name="i-lucide-check"
                class="size-4 shrink-0 text-brand-green-500"
              />
              {{ benefit }}
            </li>
          </ul>

          <NuxtLink
            to=""
            class="text-[14px] leading-6 font-semibold text-brand-blue-700 underline underline-offset-2"
          >
            Dowiedz się więcej
          </NuxtLink>
        </div>

        <!-- second add -->
        <div
          class="relative overflow-hidden rounded-xl p-6 bg-brand-blue-700 text-white min-h-[220px] flex flex-col justify-end"
        >
          <NuxtImg
            src="/imgs/cashback-ad.jpg"
            alt=""
            class="absolute inset-0 size-full object-cover"
            aria-hidden="true"
          />
          <div
            class="absolute inset-0 bg-linear-to-r from-brand-blue-700 via-brand-blue-700/50 to-brand-blue-700/20"
            aria-hidden="true"
          />

          <span
            class="absolute top-6 left-4 flex items-center gap-1.5 rounded-full bg-brand-green-500 px-2.5 py-1 text-[10px] leading-4 font-semibold text-white"
          >
            <NuxtImg
              src="/svgs/shining-star.svg"
              alt=""
              class="w-3 h-3"
              aria-hidden="true"
            />
            Pewny zwrot
          </span>

          <div class="relative mt-[45px]">
            <h3 class="text-[21px] font-bold leading-7 mb-2">
              Wybierz projekt,<br>wybuduj i odbierz zwrot!
            </h3>
            <p class="text-[12px] font-medium leading-[18px] mb-6">
              Pochwal się zdjęciami z budowy, zostaw opinię i zgarnij do 2000 zł
              cashbacku.
            </p>
            <NuxtLink
              to=""
              class="text-[12px] font-bold lead-[18px] text-white underline underline-offset-2"
            >
              Zobacz zasady
            </NuxtLink>
          </div>
        </div>
      </aside>

      <!-- Projects -->
      <div class="flex-1 min-w-0">
        <h2 class="text-[24px] leading-10 font-bold text-brand-blue-700 mb-6">
          Polecane projekty domów
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <HousePlanCard
            v-for="(plan, index) in plans"
            :key="plan.id"
            :plan="plan"
            :hot-promo="promoIndexes.includes(index)"
          />
        </div>

        <UButton
          to="/produkty"
          block
          class="mt-10 rounded-[10px] border border-brand-green-500 bg-transparent py-3 text-[14px] font-semibold leading-6 text-brand-green-500 hover:bg-brand-green-500/5"
        >
          Zobacz więcej polecanych projektów domów
        </UButton>
      </div>
    </div>
  </section>
</template>
