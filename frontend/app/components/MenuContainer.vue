<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const { isMenuOpen, closeMenu } = useMenu()
const menuRef = ref(null)

onClickOutside(menuRef, () => {
  if (isMenuOpen.value) {
    closeMenu()
  }
})

const route = useRoute()

const topBarLinks = [
  { name: 'Współpraca', path: '' },
  { name: 'Reklama', path: '' },
  { name: 'Kontakt', path: '' },
]
</script>

<template>
  <aside
    ref="menuRef"
    class="fixed top-0 left-0 h-full w-3/4 max-w-[320px] bg-brand-blue-700 text-white z-50 transition-transform duration-300 ease-in-out"
    :class="isMenuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="h-full w-full overflow-y-auto">
      <div class="flex gap-5 items-center py-5 px-3 border-b border-white/50">
        <NuxtImg
          src="/svgs/close-icon.svg"
          height="24"
          width="24"
          class="w-6 h-6 p-[3px] cursor-pointer"
          @click="closeMenu"
        />
        <NuxtImg
          src="/svgs/brand-logo-marketplace.svg"
          alt="logo"
          class="w-[98px] h-[28px]"
        />
      </div>
      <div class="px-4 mt-[26px]">
        <nav class="flex flex-col gap-1">
          <NuxtLink
            v-for="link in topBarLinks"
            :key="link.name"
            :to="link.path"
            class="py-3 px-4 rounded-lg text-[14px] font-semibold transition-colors duration-200 hover:bg-brand-blue-300"
            :class="
              link.path && route.path.includes(link.path)
                ? 'bg-brand-blue-300'
                : ''
            "
            @click="closeMenu"
          >
            {{ link.name }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </aside>
</template>
