<script setup lang="ts">
withDefaults(
  defineProps<{
    plansCount?: number
  }>(),
  { plansCount: 3421 }
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[10px] bg-brand-blue-700 text-white min-h-[400px] flex flex-col justify-end py-10 px-2"
  >
    <NuxtImg
      src="/imgs/looking-project-img.png"
      alt=""
      class="absolute inset-0 size-full object-cover"
      aria-hidden="true"
    />
    <div
      class="absolute inset-0 bg-linear-to-t from-brand-blue-700/95 via-brand-blue-700/50 to-brand-blue-700/10"
      aria-hidden="true"
    />

    <div class="relative text-center">
      <h3 class="text-[28px] leading-8 font-bold mb-2">
        Szukasz projektu?
      </h3>
      <p class="text-[18px] font-medium leading-7 mb-10">
        Znajdź projekt idealny<br>pod swoje potrzeby
      </p>
      <UButton
        to="/produkty"
        class="rounded-[10px] px-5 py-3 text-[14px] leading-6 font-semibold bg-brand-green-500 text-white hover:bg-brand-green-500/90"
      >
        Pokaż {{ plansCount }} projekty domów
      </UButton>
    </div>
  </div>
</template>
