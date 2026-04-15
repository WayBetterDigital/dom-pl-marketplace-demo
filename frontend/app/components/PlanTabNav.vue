<script setup lang="ts">
defineProps<{ planId: string }>()

const route = useRoute()
const isGaleria = computed(() => route.path.endsWith('/galeria'))
const isPliki = computed(() => route.path.endsWith('/pliki'))
const isDane = computed(() => !isGaleria.value && !isPliki.value)
</script>

<template>
  <nav class="border-b border-default">
    <div class="flex gap-0">
      <NuxtLink
        :to="`/produkty/${planId}`"
        :class="[
          'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          isDane
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
      <NuxtLink
        :to="`/produkty/${planId}/pliki`"
        :class="[
          'px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          isPliki
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-default hover:border-default'
        ]"
      >
        Pliki
      </NuxtLink>
    </div>
  </nav>
</template>
