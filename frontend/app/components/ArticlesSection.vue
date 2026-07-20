<script setup lang="ts">
const image = '/imgs/categories/no-garage-houses.jpg'

const articles = [
  { title: 'Rynek mieszkaniowy 2025 – ceny w górę czy stabilizacja?', image, to: '' },
  { title: 'Nowoczesne ogrody zimowe – trend, który zyskuje popularność', image, to: '' },
  { title: '5 błędów przy wyborze materiałów, które kosztują fortunę', image, to: '' },
  { title: 'Dom energooszczędny: inwestycja, która się zwraca', image, to: '' },
  { title: 'Minimalizm kontra przytulność – jak znaleźć złoty środek', image, to: '' },
  { title: 'Jak tanio odmienić salon – 7 trików dekoracyjnych', image, to: '' },
  { title: 'Jak tanio odmienić salon – 7 trików dekoracyjnych', image, to: '' },
  { title: 'Jak tanio odmienić salon – 7 trików dekoracyjnych', image, to: '' },
  { title: 'Jak tanio odmienić salon – 7 trików dekoracyjnych', image, to: '' }
]
</script>

<template>
  <section class="mt-[106px] mb-30">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-[24px] leading-10 font-bold text-brand-blue-700">
        Artykuły i newsy
      </h2>
      <NuxtLink
        to=""
        class="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-700/80 underline cursor-pointer"
      >
        Sprawdź więcej
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </NuxtLink>
    </div>

    <div class="sm:hidden">
      <ArticleCard
        :title="articles[0].title"
        :image="articles[0].image"
        :to="articles[0].to"
        featured
        class="aspect-[16/10]"
      />

      <div class="flex flex-col gap-5 mt-5">
        <ArticleListItem
          v-for="(article, index) in articles.slice(1)"
          :key="index"
          :title="article.title"
          :image="article.image"
          :to="article.to"
        />
      </div>

      <NuxtLink
        to=""
        class="flex items-center justify-center gap-1 mt-8 text-[14px] font-bold text-brand-blue-700 underline underline-offset-2 cursor-pointer"
      >
        Sprawdź więcej
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </NuxtLink>
    </div>

    <div
      class="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:auto-rows-[165px]"
    >
      <ArticleCard
        v-for="(article, index) in articles"
        :key="index"
        :title="article.title"
        :image="article.image"
        :to="article.to"
        :featured="index === 0"
        class="aspect-[16/10] lg:aspect-auto"
        :class="index === 0 ? 'sm:col-span-2 lg:row-span-2' : ''"
      />
    </div>
  </section>
</template>
