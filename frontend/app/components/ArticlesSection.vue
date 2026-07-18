<script setup lang="ts">

</script>

<template>
  <section class="mt-[106px] mb-30">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-[24px] leading-10 font-bold text-brand-blue-700">
        Artykuły i newsy
      </h2>
      <NuxtLink
        to=""
        class="flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-700/80 underline cursor-pointer"
      >
        Sprawdź więcej
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </NuxtLink>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:auto-rows-[165px]"
    >
      <ArticleCard
        v-for="(article, index) in 9"
        :key="index"
        :title="'tesowy artykuł'"
        :image="'/imgs/categories/no-garage-houses.jpg'"
        :featured="index === 0"
        class="aspect-[16/10] lg:aspect-auto"
        :class="index === 0 ? 'sm:col-span-2 lg:row-span-2' : ''"
      />
    </div>
  </section>
</template>
