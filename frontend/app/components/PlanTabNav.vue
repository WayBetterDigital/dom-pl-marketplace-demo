<script setup lang="ts">
defineProps<{ planId: string }>()

const route = useRoute()
const isGaleria = computed(() => route.path.endsWith('/galeria'))
</script>

<template>
  <nav class="border-b border-default">
    <div class="flex gap-0">
      <NuxtLink
        :to="`/produkty/${planId}`"
        :class="[
          'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          !isGaleria
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-default hover:border-default'
        ]"
      >
        Dane projektu
      </NuxtLink>
      <NuxtLink
        :to="`/produkty/${planId}/galeria`"
        :class="[
          'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          isGaleria
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-default hover:border-default'
        ]"
      >
        Galeria
      </NuxtLink>
    </div>
  </nav>
</template>
