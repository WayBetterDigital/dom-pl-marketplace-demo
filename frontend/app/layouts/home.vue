<script setup lang="ts">
const { isOverlayVisible, overlayMode, hideOverlay } = useSiteOverlay()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-brand-page overflow-x-clip">
    <div
      class="fixed inset-0 bg-brand-blue-700/40 backdrop-blur-sm z-40 transition-opacity duration-300"
      :class="
        isOverlayVisible && overlayMode === 'full'
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      "
      @click="hideOverlay"
    />
    <div
      class="absolute inset-0 bg-brand-blue-700 z-10 transition-opacity duration-300"
      :class="
        isOverlayVisible && overlayMode === 'partial'
          ? 'opacity-40 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      "
      @click="hideOverlay"
    />
    <MenuContainer />
    <NavBarTop />
    <NavBarBottomMarketplace />
    <!-- Poziomy padding sekcji strony głównej — jedno miejsce, sekcje go dziedziczą -->
    <main class="flex-1 flex flex-col px-4 md:px-[137px]">
      <slot />
    </main>
    <!-- Poza <main>, więc na pełną szerokość — footer ma własny kontener -->
    <Footer />
  </div>
</template>
