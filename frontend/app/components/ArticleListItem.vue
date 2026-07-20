<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    image: string
    to?: string
  }>(),
  { to: '' }
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-4"
  >
    <img
      :src="image"
      :alt="title"
      class="w-[92px] h-[72px] shrink-0 rounded-lg object-cover"
      loading="lazy"
    >
    <h3
      class="text-[14px] leading-5 font-semibold text-brand-blue-700 line-clamp-2 group-hover:underline"
    >
      {{ title }}
    </h3>
  </NuxtLink>
</template>
