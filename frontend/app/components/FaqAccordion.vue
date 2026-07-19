<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

withDefaults(
  defineProps<{
    items?: AccordionItem[]
  }>(),
  {
    items: () => [
      {
        label: 'Co zawiera kompletny, gotowy projekt domu?',
        content:
          'test'
      },
      {
        label: 'Czym jest adaptacja projektu i czy jest obowiązkowa?',
        content:
          'test'
      },
      {
        label: 'Czy w zakupionym projekcie domu można wprowadzać zmiany?',
        content:
          'test'
      },
      {
        label: 'Jak dobrać projekt domu do zapisów w MPZP lub WZ?',
        content:
          'test'
      },
      {
        label: 'Czy Wasze projekty domów spełniają najnowsze normy WT 2026?',
        content:
          'test'
      }
    ]
  }
)
</script>

<template>
  <div>
    <h2 class="text-[24px] leading-8 font-bold text-brand-blue-700 mb-10">
      Najczęściej zadawane pytania
    </h2>

    <UAccordion
      :items="items"
      :ui="{
        root: 'flex flex-col gap-2',
        item: 'border-0 rounded-[8px] bg-white',
        trigger: 'px-6 py-[17px] gap-4 text-[16px] leading-[26px] font-semibold text-brand-blue-700 cursor-pointer',
        label: 'text-start',
        trailingIcon: 'size-5 text-brand-blue-700 rotate-0 group-data-[state=open]:rotate-0',
        body: 'px-6 pb-4 text-[14px] leading-6 text-brand-blue-700/80'
      }"
    >
      <template #trailing="{ open }">
        <UIcon
          :name="open ? 'i-lucide-minus' : 'i-lucide-plus'"
          class="ms-auto size-6 shrink-0 text-brand-blue-700"
        />
      </template>
    </UAccordion>
  </div>
</template>
