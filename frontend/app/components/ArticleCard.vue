<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    image: string
    category?: string
    to?: string
    featured?: boolean
  }>(),
  { category: 'Artykuły i newsy', to: '', featured: false }
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="group relative block overflow-hidden rounded-[10px] bg-brand-blue-700"
  >
    <img
      :src="image"
      :alt="title"
      class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
    >
    <div
      class="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent"
      aria-hidden="true"
    />

    <span
      class="absolute top-3 left-3 rounded-full bg-brand-green-500 p-2 text-[10px] leading-4 font-semibold text-white"
    >
      {{ category }}
    </span>

    <h3
      class="absolute inset-x-0 bottom-0 p-4 font-bold text-white"
      :class="featured ? 'text-[22px] leading-7' : 'text-[13px] leading-5'"
    >
      {{ title }}
    </h3>
  </NuxtLink>
</template>
