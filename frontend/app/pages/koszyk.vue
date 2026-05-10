<script setup lang="ts">
import { useCartService } from '~/composables/services/useCartService'
import { useAuthService } from '~/composables/services/useAuthService'
import { useStripe } from '~/composables/useStripe'

const cartService = useCartService()
const { customer } = useAuthService()
const { getStripe } = useStripe()
const router = useRouter()
const toast = useToast()
const isCheckingOut = ref(false)
const removingItemId = ref<string | null>(null)

const { data: cart, refresh, pending } = await useAsyncData('cart', () => cartService.getCart(), { server: false })

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
  if (!customer.value) {
    toast.add({
      title: 'Wymagane logowanie',
      description: 'Musisz być zalogowany, aby złożyć zamówienie.',
      color: 'warning',
      icon: 'i-lucide-log-in',
    })
    return router.push('/konto/logowanie-klient')
  }

  isCheckingOut.value = true
  try {
    const { orderId, clientSecret } = await cartService.initiateStripeP24Payment({
      email: customer.value.email,
      first_name: customer.value.first_name ?? '',
      last_name: customer.value.last_name ?? '',
    })

    sessionStorage.setItem('stripe_order_id', orderId)

    const stripe = await getStripe()
    if (!stripe) throw new Error('Nie udało się załadować systemu płatności')

    // Redirects to P24 bank selection — returns only on error
    const { error } = await stripe.confirmP24Payment(clientSecret, {
      payment_method: {
        p24: { bank: 'other' },
        billing_details: { email: customer.value.email },
      },
      return_url: `${window.location.origin}/platnosc/potwierdzenie`,
    })

    if (error) throw new Error(error.message)
    // On success Stripe navigates away — isCheckingOut stays true intentionally
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Wystąpił błąd podczas składania zamówienia.'
    toast.add({ title: 'Błąd płatności', description: msg, color: 'error' })
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

    <div v-else-if="!cart || !cart.items || cart.items.length === 0" class="text-center py-12 bg-elevated rounded-xl border border-default">
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
        <ul class="divide-y divide-default">
          <li
            v-for="item in cart.items"
            :key="item.id"
            class="py-4 flex items-center justify-between gap-4"
          >
            <NuxtLink
              :to="item.variant?.product?.house_plan?.id ? `/produkty/${item.variant.product.house_plan.id}` : undefined"
              class="flex items-center gap-4 group flex-1 min-w-0"
            >
              <div class="size-20 shrink-0 bg-elevated rounded-lg flex items-center justify-center overflow-hidden border border-default">
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
                  <UIcon name="i-lucide-arrow-right" class="size-3" />
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

        <UButton
          size="xl"
          icon="i-lucide-check-circle"
          :loading="isCheckingOut"
          class="cursor-pointer"
          @click="handleCheckout"
        >
          Złóż zamówienie
        </UButton>
      </div>
    </div>
  </div>
</template>
