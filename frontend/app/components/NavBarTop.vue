<script lang="ts" setup>
const { openMenu } = useMenu()

const NavbarLinks = useNavbarLinks()

const topBarButtons = [
  {
    name: 'Współpraca',
    path: '/wspolpraca',
    icon: '/svgs/collaboration-gray.svg'
  },
  { name: 'Reklama', path: '/reklama', icon: '/svgs/advertisement.svg' },
  { name: 'Kontakt', path: '/kontakt', icon: '/svgs/contact.svg' }
]

const route = useRoute()

function isLinkActive(path: string) {
  return path === '/'
    ? route.path === '/' || route.path.startsWith('/produkty')
    : route.path.startsWith(path)
}

function handleOpenMenu() {
  openMenu()
}
</script>

<template>
  <nav
    class="bg-brand-blue-700 text-white text-[10px] xlg:text-[14px] leading-4 sm:leading-[24px] font-semibold px-3 md:px-10"
  >
    <div
      class="bg-brand-blue-300 border border-brand-blue-200 p-0.5 items-center justify-start rounded-md my-4 flex md:hidden w-fit gap-1.5"
    >
      <NuxtLink
        v-for="link in NavbarLinks"
        :key="link.path"
        :to="link.path"
      >
        <button
          class="rounded-[10px] flex items-center justify-center px-2.5 py-2 font-semibold text-nowrap text-[10px] leading-4 cursor-pointer"
          :class="
            isLinkActive(link.path)
              ? 'bg-brand-green-500 text-white'
              : 'bg-transparent text-white'
          "
        >
          <NuxtImg :src="link.icon" alt="" class="w-4 h-4 mr-1" />
          <span>{{ link.name }}</span>
        </button>
      </NuxtLink>
    </div>
    <div class="flex justify-between items-stretch max-w-8xl m-auto">
      <section class="flex flex-row justify-center items-center">
        <div class="flex items-center gap-4">
          <NuxtImg
            src="/svgs/kebab-icon.svg"
            alt="menu"
            class="flex md:hidden w-6 h-6 cursor-pointer"
            @click.stop="handleOpenMenu"
          />
          <NuxtLink to="/" class="my-4 md:my-0">
            <NuxtImg
              src="/svgs/brand-logo-marketplace.svg"
              class="md:w-[152px] md:h-[43px] w-[98px] h-[28px] mr-12"
            />
          </NuxtLink>
        </div>
        <div
          class="bg-brand-blue-300 border border-brand-blue-200 p-1 items-center justify-center rounded-md my-4 hidden md:flex"
        >
          <NuxtLink
            v-for="link in NavbarLinks"
            :key="link.path"
            :to="link.path"
          >
            <button
              class="rounded-[10px] flex items-center justify-center px-5 py-3 font-semibold text-sm text-nowrap cursor-pointer"
              :class="
                isLinkActive(link.path)
                  ? 'bg-brand-green-500 text-white'
                  : 'bg-transparent text-white'
              "
            >
              <NuxtImg :src="link.icon" alt="" class="w-5 h-5 mr-1" />
              <span>{{ link.name }}</span>
            </button>
          </NuxtLink>
        </div>
      </section>
      <section class="flex md:items-stretch items-center justify-end min-w-0">
        <div class="h-full w-px opacity-30 bg-white hidden md:block" />
        <div
          v-for="button in topBarButtons"
          :key="button.name"
          class="hidden md:flex flex-row"
        >
          <NuxtLink
            :to="button.path"
            class="flex flex-row items-center gap-1 px-5 h-full"
          >
            <NuxtImg
              :src="button.icon"
              :alt="button.name"
              class="w-4.25 h-4.25"
            />
            <span class="text-sm">{{ button.name }}</span>
          </NuxtLink>
          <div class="h-full w-px opacity-30 bg-white" />
        </div>
      </section>
    </div>
  </nav>
</template>
