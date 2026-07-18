<script setup lang="ts">
import { searchCategoryColumns } from '~/constants/searchCategories'
</script>

<template>
  <section class="border-t border-[#AEB6CF] px-4 md:px-[137px] py-20">
    <h2 class="text-[24px] leading-10 font-bold text-brand-blue-700">
      Wyszukaj projekty po kategoriach
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mt-10">
      <div
        v-for="(column, i) in searchCategoryColumns"
        :key="i"
        class="flex flex-col gap-[14px]"
      >
        <NuxtLink
          v-for="category in column"
          :key="category.name"
          :to="category.to"
          class="w-fit text-[14px] leading-6 font-normal text-brand-blue-700 hover:text-brand-blue-700/80 hover:underline"
        >
          Projekty domów {{ category.name }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
