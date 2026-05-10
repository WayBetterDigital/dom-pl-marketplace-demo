<script setup lang="ts">
const route = useRoute()
const reason = computed(() => route.query.reason as string | undefined)
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
    <div class="flex flex-col items-center gap-6">
      <div class="size-20 rounded-full bg-error/10 flex items-center justify-center">
        <UIcon name="i-lucide-x-circle" class="size-12 text-error" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-default mb-2">Płatność nieudana</h1>
        <p class="text-muted text-lg">
          {{ reason || 'Płatność została anulowana lub nie powiodła się.' }}
        </p>
        <p class="text-muted mt-2">Twój koszyk wciąż jest dostępny — możesz spróbować ponownie.</p>
      </div>
      <div class="flex gap-3">
        <UButton to="/koszyk" icon="i-lucide-shopping-cart">
          Wróć do koszyka
        </UButton>
        <UButton to="/produkty" variant="outline" icon="i-lucide-search">
          Przeglądaj projekty
        </UButton>
      </div>
    </div>
  </div>
</template>
