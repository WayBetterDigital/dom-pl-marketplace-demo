<script setup lang="ts">
import { useAuthService } from '~/composables/services/useAuthService'
import { useVendorAuthService } from '~/composables/services/useVendorAuthService'

const searchQuery = ref('')
const isSearchOpen = ref(false)

const { customer } = useAuthService()
const { vendor } = useVendorAuthService()

const profileLink = computed(() => {
  if (vendor.value) return '/konto/sprzedawca'
  if (customer.value) return '/konto/klient'
  return '/konto/logowanie'
})

const cart = useState<any>('cart')
const cartCount = computed(() =>
  cart.value?.items?.reduce((sum: number, item: any) => sum + (item.quantity ?? 1), 0) ?? 0
)
</script>

<template>
  <header class="border-b border-default bg-default sticky top-0 z-50">
    <UContainer>
      <nav class="flex items-center gap-4 h-16">
        <NuxtLink to="/" class="shrink-0 text-default hover:text-primary transition-colors">
          <AppLogo class="h-7 w-auto" />
        </NuxtLink>

        <div class="flex-1" />

        <!-- <div class="hidden sm:flex items-center">
          <UInput
            v-model="searchQuery"
            placeholder="Szukaj produktów..."
            icon="i-lucide-search"
            size="sm"
            class="w-56 lg:w-72"
            @keyup.enter="isSearchOpen = false"
          />
        </div>

        <UButton
          icon="i-lucide-search"
          variant="ghost"
          color="neutral"
          size="sm"
          class="sm:hidden"
          aria-label="Szukaj"
        /> -->

        <UButton
          :to="profileLink"
          icon="i-lucide-circle-user"
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label="Konto"
        />

        <div class="relative">
          <UButton
            to="/koszyk"
            icon="i-lucide-shopping-bag"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Koszyk"
          />
          <span
            v-if="cartCount > 0"
            class="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center pointer-events-none"
          >
            {{ cartCount > 9 ? '9+' : cartCount }}
          </span>
        </div>
      </nav>
    </UContainer>
  </header>
</template>
