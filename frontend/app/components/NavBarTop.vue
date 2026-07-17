<script lang="ts" setup>
import { secondaryNavLinks } from '~/constants/navigation'
</script>

<template>
  <nav
    class="w-full flex flex-row justify-between bg-brand-green-500 text-white text-[10px] sm:text-xs leading-4 sm:leading-[21px] font-semibold"
  >
    <section class="flex justify-center">
      <NuxtLink to="" class="flex">
        <div
          class="flex flex-row justify-center items-center px-5 bg-brand-blue-700 py-2.5"
        >
          <UIcon
            name="i-local-house-plans"
            class="w-4 h-4 mr-1 text-brand-green-500"
          />
          Projekty domów
        </div>
      </NuxtLink>
      <NuxtLink to="" class="flex">
        <div
          class="flex flex-row justify-center items-center px-5 py-2.5 border-x border-x-white/30"
        >
          <UIcon
            name="i-local-article-news"
            class="w-4 h-4 mr-1 text-white"
          />
          Artykuły i newsy
        </div>
      </NuxtLink>
      <!--
      <NuxtLink to="" class="flex">
        <div
          class="flex flex-row justify-center items-center px-5 py-2.5 border-r border-r-white/30"
        >
          <NuxtImg
            src="/svgs/announcements.svg"
            alt="article news"
            class="w-4 h-4 mr-1"
          />
          Ogłoszenia
        </div>
      </NuxtLink> -->
    </section>
    <section class="hidden md:flex">
      <NuxtLink
        v-for="link in secondaryNavLinks"
        :key="link.name"
        :to="link.path"
        class="px-5 py-2.5 border-l border-l-white/30"
      >
        {{ link.name }}
      </NuxtLink>
    </section>
  </nav>
</template>
