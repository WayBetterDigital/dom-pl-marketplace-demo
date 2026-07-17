<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const { isMenuOpen, closeMenu } = useMenu()
const menuRef = ref(null)

onClickOutside(menuRef, () => {
  if (isMenuOpen.value) {
    closeMenu()
  }
})

const mainLinks = [
  { name: 'Projekty domów', path: '' },
  { name: 'Nowości', path: '' },
  { name: 'Popularne', path: '' },
  { name: 'Promocje', path: '' }
]

const secondaryLinks = [
  { name: 'Współpraca', path: '' },
  { name: 'Reklama', path: '' },
  { name: 'Kontakt', path: '' }
]
</script>

<template>
  <aside
    ref="menuRef"
    class="fixed top-0 left-0 h-full w-[85%] max-w-[360px] bg-brand-blue-700 text-white z-50 transition-transform duration-300 ease-in-out"
    :class="isMenuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="h-full w-full overflow-y-auto">
      <div
        class="flex items-center justify-between gap-3 py-4 px-4 border-b border-white/15"
      >
        <div class="flex items-center gap-4">
          <button
            type="button"
            aria-label="Zamknij menu"
            class="cursor-pointer"
            @click="closeMenu"
          >
            <NuxtImg
              src="/svgs/close-icon.svg"
              height="24"
              width="24"
              class="w-6 h-6"
            />
          </button>
          <NuxtImg
            src="/svgs/brand-logo-marketplace.svg"
            alt="logo"
            class="w-[98px] h-[28px]"
          />
        </div>

        <div
          class="flex items-center gap-4 rounded-full border border-white/30 px-3 py-2"
        >
          <NuxtLink
            to=""
            class="relative shrink-0"
          >
            <NuxtImg
              src="/svgs/heart-outline-white.svg"
              alt="Ulubione"
              class="w-[18px] h-[18px]"
            />
            <span
              class="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[13px] h-[13px] px-1 rounded-full bg-brand-crimson-700 text-[9px] leading-3 font-medium"
            >
              0
            </span>
          </NuxtLink>

          <NuxtLink
            to=""
            class="relative shrink-0"
          >
            <NuxtImg
              src="/svgs/cart.svg"
              alt="Koszyk"
              class="w-[18px] h-[18px]"
            />
            <span
              class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[13px] h-[13px] px-1 rounded-full bg-brand-crimson-700 text-[9px] leading-3 font-medium"
            >
              0
            </span>
          </NuxtLink>

          <NuxtLink
            to=""
            class="shrink-0"
          >
            <NuxtImg
              src="/svgs/account.svg"
              alt="Konto"
              class="w-[18px] h-[18px]"
            />
          </NuxtLink>
        </div>
      </div>

      <!-- Główne linki -->
      <nav class="flex flex-col gap-1 px-4 py-5 border-b border-white/15">
        <NuxtLink
          v-for="link in mainLinks"
          :key="link.name"
          :to="link.path"
          class="py-2.5 px-2 rounded-lg text-[15px] font-semibold transition-colors duration-200 hover:bg-brand-blue-300"
          @click="closeMenu"
        >
          {{ link.name }}
        </NuxtLink>
      </nav>

      <!-- Linki drugorzędne -->
      <nav class="flex flex-col gap-1 px-4 py-5">
        <NuxtLink
          v-for="link in secondaryLinks"
          :key="link.name"
          :to="link.path"
          class="py-2.5 px-2 rounded-lg text-[15px] font-semibold transition-colors duration-200 hover:bg-brand-blue-300"
          @click="closeMenu"
        >
          {{ link.name }}
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>
