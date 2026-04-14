<script setup lang="ts">
import { useAsyncData, useRouter, ref, computed } from '#imports'
import { useCartService } from '~/composables/services/useCartService'
import { useCustomerService } from '~/composables/services/useCustomerService'

const cartService = useCartService()
const customerService = useCustomerService()
const router = useRouter()
const toast = useToast()
const isCheckingOut = ref(false)
const removingItemId = ref<string | null>(null)
const selectedCustomerId = ref<string | undefined>(undefined)

const { data: cart, refresh, pending } = await useAsyncData('cart', () => cartService.getCart())
const { data: customersData } = useAsyncData('checkout-customers', () => customerService.listCustomers())

const customerOptions = computed(() =>
  (customersData.value?.data ?? []).map(c => ({
    label: `${c.first_name} ${c.last_name} (${c.email})`,
    value: c.id
  }))
)

const selectedCustomer = computed(() =>
  customersData.value?.data.find(c => c.id === selectedCustomerId.value)
)

const handleRemove = async (lineItemId: string) => {
  removingItemId.value = lineItemId
  try {
    await cartService.removeFromCart(lineItemId)
    await refresh()
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć produktu.', color: 'error' })
  } finally {
    removingItemId.value = null
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(price)
}

const handleCheckout = async () => {
  if (!selectedCustomerId.value) {
    toast.add({ title: 'Wybierz konto', description: 'Wybierz konto klienta przed złożeniem zamówienia.', color: 'warning' })
    return
  }
  isCheckingOut.value = true
  try {
    await cartService.completeDummyCheckout(
      selectedCustomer.value
        ? { email: selectedCustomer.value.email, first_name: selectedCustomer.value.first_name, last_name: selectedCustomer.value.last_name }
        : undefined
    )
    toast.add({
      title: 'Sukces',
      description: 'Zamówienie zostało złożone pomyślnie!',
      color: 'success'
    })
    router.push('/')
  } catch (error) {
    console.error('Checkout failed:', error)
    toast.add({
      title: 'Błąd',
      description: 'Wystąpił błąd podczas składania zamówienia.',
      color: 'error'
    })
  } finally {
    isCheckingOut.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
    <h1 class="text-3xl font-bold text-default mb-8">Twój koszyk</h1>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!cart || !cart.items || cart.items.length === 0" class="text-center py-12 bg-[var(--ui-bg-elevated)] rounded-xl border border-[var(--ui-border)]">
      <UIcon name="i-lucide-shopping-cart" class="size-16 text-muted mb-4 mx-auto" />
      <h2 class="text-xl font-semibold text-default mb-2">Twój koszyk jest pusty</h2>
      <p class="text-muted mb-6">Przejdź do projektów, aby znaleźć coś dla siebie.</p>
      <UButton to="/produkty" size="lg" icon="i-lucide-search">
        Przeglądaj projekty
      </UButton>
    </div>

    <div v-else class="space-y-8">
      <!-- Cart Items -->
      <UCard>
        <ul class="divide-y divide-[var(--ui-border)]">
          <li
            v-for="item in cart.items"
            :key="item.id"
            class="py-4 flex items-center justify-between gap-4"
          >
            <NuxtLink
              :to="item.variant?.product?.house_plan?.id ? `/produkty/${item.variant.product.house_plan.id}` : undefined"
              class="flex items-center gap-4 group flex-1 min-w-0"
            >
              <div class="size-20 shrink-0 bg-[var(--ui-bg-elevated)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--ui-border)]">
                <NuxtImg
                  v-if="item.variant?.product?.thumbnail"
                  :src="item.variant.product.thumbnail"
                  class="w-full h-full object-cover"
                  alt="Miniatura projektu"
                />
                <UIcon v-else name="i-lucide-home" class="size-8 text-muted" />
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-default group-hover:text-primary transition-colors truncate">{{ item.title }}</h3>
                <p class="text-sm text-muted">Ilość: {{ item.quantity }}</p>
                <p
                  v-if="item.variant?.product?.house_plan?.id"
                  class="text-xs text-primary mt-0.5 flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-3"
                  />
                  Zobacz projekt
                </p>
              </div>
            </NuxtLink>
            <div class="flex items-center gap-4">
              <span class="font-bold text-lg">{{ formatPrice(item.unit_price) }}</span>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="sm"
                class="cursor-pointer"
                :loading="removingItemId === item.id"
                :disabled="removingItemId !== null"
                @click="handleRemove(item.id)"
              />
            </div>
          </li>
        </ul>
      </UCard>

      <!-- Cart Summary -->
      <div class="flex flex-col items-end gap-4">
        <div class="text-xl">
          <span class="text-muted mr-4">Suma częściowa:</span>
          <span class="font-bold text-2xl">{{ formatPrice(cart.subtotal || 0) }}</span>
        </div>

        <div class="w-full max-w-sm flex flex-col gap-2">
          <label class="text-sm text-muted font-medium">Konto klienta (demo)</label>
          <USelect
            v-model="selectedCustomerId"
            :items="customerOptions"
            placeholder="Wybierz klienta..."
            value-key="value"
            label-key="label"
          />
        </div>

        <UButton
          size="xl"
          icon="i-lucide-check-circle"
          :loading="isCheckingOut"
          :disabled="!selectedCustomerId"
          class="cursor-pointer"
          @click="handleCheckout"
        >
          Złóż zamówienie
        </UButton>
      </div>
    </div>
  </div>
</template>
