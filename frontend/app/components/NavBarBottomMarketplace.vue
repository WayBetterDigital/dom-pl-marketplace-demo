<script lang="ts" setup>
import { mainNavLinks } from '~/constants/navigation'

const { openMenu } = useMenu()

function handleOpenMenu() {
  openMenu()
}
</script>

<template>
  <nav
    class="bg-brand-blue-700 text-white text-[14px] leading-4 sm:leading-6 font-semibold"
  >
    <div class="flex justify-between items-center px-3 md:px-10 py-4">
      <section class="flex flex-row justify-center items-center">
        <div class="flex items-center gap-4">
          <NuxtImg
            src="/svgs/kebab-icon.svg"
            alt="menu"
            class="flex md:hidden w-6 h-6 cursor-pointer"
            @click.stop="handleOpenMenu"
          />
          <NuxtLink to="/">
            <NuxtImg
              src="/svgs/brand-logo-marketplace.svg"
              class="w-[124px] h-[35px] mr-12"
            />
          </NuxtLink>
        </div>
        <div class="hidden md:flex">
          <NuxtLink
            v-for="link in mainNavLinks"
            :key="link.name"
            :to="link.path"
            class="px-4 py-3"
          >
            {{ link.name }}
          </NuxtLink>
        </div>
      </section>
      <section class="flex justify-end min-w-0">
        <div
          class="flex items-center gap-7 rounded-full border border-white/30 px-4 py-3"
        >
          <NuxtLink to="" class="relative shrink-0">
            <NuxtImg
              src="/svgs/heart-outline-white.svg"
              alt="Ulubione"
              class="w-[19px] h-[19px]"
            />
            <span
              class="absolute -top-1 -right-2 flex items-center justify-center min-w-[13px] h-[13px] px-1 rounded-full bg-brand-crimson-700 text-[9px] leading-3 font-medium"
            >
              0
            </span>
          </NuxtLink>

          <NuxtLink to="" class="relative shrink-0">
            <NuxtImg src="/svgs/cart.svg" alt="Koszyk" class="w-5 h-5" />
            <span
              class="absolute -top-1 -right-1 flex items-center justify-center min-w-[13px] h-[13px] px-1 rounded-full bg-brand-crimson-700 text-[9px] leading-3 font-medium"
            >
              0
            </span>
          </NuxtLink>

          <NuxtLink to="" class="shrink-0">
            <NuxtImg src="/svgs/account.svg" alt="Konto" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Mobile: kategorie -->
    <div class="md:hidden overflow-x-auto no-scrollbar mx-2 pb-2 mb-1.5">
      <div class="flex w-max gap-6 px-3">
        <NuxtLink
          v-for="link in mainNavLinks"
          :key="link.name"
          :to="link.path"
          class="py-2 whitespace-nowrap"
        >
          {{ link.name }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
