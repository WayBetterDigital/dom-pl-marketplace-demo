<script setup lang="ts">
const benefits = [
  'Kompletna dokumentacja techniczna',
  '100% Zgodności z WT 2026',
  'Bezproblemowa Adaptacja'
]
</script>

<template>
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
</template>
