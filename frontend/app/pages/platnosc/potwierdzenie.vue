<script setup lang="ts">
import { useCartService } from '~/composables/services/useCartService'
import { useOrderService } from '~/composables/services/useOrderService'

const route = useRoute()
const cartService = useCartService()
const orderService = useOrderService()

const orderId = ref<string | null>(null)
const order = ref<any>(null)
const status = ref<'loading' | 'success' | 'accepted' | 'pending' | 'error'>('loading')
const pollCount = ref(0)
const MAX_POLLS = 8

const isPaymentSuccess = computed(() => ['captured', 'paid', 'authorized'].includes(order.value?.payment_status))
const isPaymentPending = computed(() => ['awaiting', 'not_paid'].includes(order.value?.payment_status))

async function pollOrder(id: string) {
  try {
    order.value = await orderService.getOrder(id)
    if (isPaymentSuccess.value) {
      status.value = 'success'
    } else if (isPaymentPending.value && pollCount.value < MAX_POLLS) {
      pollCount.value++
      setTimeout(() => pollOrder(id), 4000)
    } else {
      status.value = pollCount.value >= MAX_POLLS ? 'pending' : 'error'
    }
  } catch {
    status.value = 'error'
  }
}

onMounted(async () => {
  const redirectStatus = route.query.redirect_status as string | undefined

  if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
    status.value = 'error'
    return
  }

  // Complete the cart (or retrieve the order if the webhook already completed it)
  const { orderId: id } = await cartService.completeStripeCheckout()

  if (id) {
    orderId.value = id
    await pollOrder(id)
  } else if (redirectStatus === 'succeeded') {
    // Webhook completed the cart before we could — order exists but we don't have its ID yet
    status.value = 'accepted'
  } else {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
    <!-- Loading -->
    <div v-if="status === 'loading'" class="flex flex-col items-center gap-4">
      <UIcon name="i-lucide-loader-2" class="size-16 animate-spin text-primary" />
      <p class="text-lg text-muted">Finalizujemy zamówienie...</p>
    </div>

    <!-- Success (with order details) -->
    <div v-else-if="status === 'success'" class="flex flex-col items-center gap-6">
      <div class="size-20 rounded-full bg-success/10 flex items-center justify-center">
        <UIcon name="i-lucide-check-circle-2" class="size-12 text-success" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-default mb-2">Dziękujemy za zamówienie!</h1>
        <p class="text-muted text-lg">Płatność została zrealizowana pomyślnie.</p>
      </div>
      <div v-if="order?.display_id" class="bg-elevated rounded-xl border border-default px-6 py-4 text-sm">
        <span class="text-muted">Numer zamówienia:</span>
        <span class="font-mono font-semibold text-default ml-2">DOM-{{ order.display_id }}</span>
      </div>
      <div v-if="order?.items?.length" class="w-full bg-elevated rounded-xl border border-default divide-y divide-default text-left">
        <div v-for="item in order.items" :key="item.id" class="px-6 py-4 flex items-center justify-between gap-4">
          <span class="text-default font-medium">{{ item.title }}</span>
          <span class="text-muted text-sm shrink-0">{{ item.quantity }} szt.</span>
        </div>
      </div>
      <div class="flex gap-3">
        <UButton to="/produkty" variant="outline" icon="i-lucide-search">Przeglądaj projekty</UButton>
        <UButton to="/konto/klient" icon="i-lucide-package">Moje zamówienia</UButton>
      </div>
    </div>

    <!-- Accepted (webhook was faster — order exists but we don't have its ID) -->
    <div v-else-if="status === 'accepted'" class="flex flex-col items-center gap-6">
      <div class="size-20 rounded-full bg-success/10 flex items-center justify-center">
        <UIcon name="i-lucide-check-circle-2" class="size-12 text-success" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-default mb-2">Dziękujemy za zamówienie!</h1>
        <p class="text-muted text-lg">Płatność przyjęta. Zamówienie znajdziesz w historii swojego konta.</p>
      </div>
      <div class="flex gap-3">
        <UButton to="/produkty" variant="outline" icon="i-lucide-search">Przeglądaj projekty</UButton>
        <UButton to="/konto/klient" icon="i-lucide-package">Moje zamówienia</UButton>
      </div>
    </div>

    <!-- Pending (payment processing, webhook not yet fired) -->
    <div v-else-if="status === 'pending'" class="flex flex-col items-center gap-6">
      <div class="size-20 rounded-full bg-warning/10 flex items-center justify-center">
        <UIcon name="i-lucide-clock" class="size-12 text-warning" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-default mb-2">Przetwarzamy płatność</h1>
        <p class="text-muted text-lg">
          Twoje zamówienie zostało przyjęte. Potwierdzenie płatności jest w toku —
          sprawdź ponownie za chwilę.
        </p>
      </div>
      <div v-if="order?.display_id" class="bg-elevated rounded-xl border border-default px-6 py-4 text-sm">
        <span class="text-muted">Numer zamówienia:</span>
        <span class="font-mono font-semibold text-default ml-2">DOM-{{ order.display_id + 999 }}</span>
      </div>
      <div class="flex gap-3">
        <UButton to="/produkty" variant="outline" icon="i-lucide-search">Przeglądaj projekty</UButton>
        <UButton to="/konto/klient" icon="i-lucide-package">Sprawdź zamówienia</UButton>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="flex flex-col items-center gap-6">
      <div class="size-20 rounded-full bg-error/10 flex items-center justify-center">
        <UIcon name="i-lucide-x-circle" class="size-12 text-error" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-default mb-2">Płatność nieudana</h1>
        <p class="text-muted text-lg">
          Płatność została anulowana lub nie powiodła się. Twój koszyk wciąż jest dostępny.
        </p>
      </div>
      <div class="flex gap-3">
        <UButton to="/koszyk" icon="i-lucide-shopping-cart">Wróć do koszyka</UButton>
        <UButton to="/produkty" variant="outline" icon="i-lucide-search">Przeglądaj projekty</UButton>
      </div>
    </div>
  </div>
</template>
