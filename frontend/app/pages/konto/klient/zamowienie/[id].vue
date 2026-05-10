<script setup lang="ts">
import { useCustomerService } from '~/composables/services/useCustomerService'
import { useAuthService } from '~/composables/services/useAuthService'
import { useCustomerDownloadService } from '~/composables/services/useCustomerDownloadService'
import type { AppOrder } from '~/types/order'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orderId = route.params.id as string

const { customer } = useAuthService()
const { getCustomerOrders } = useCustomerService()

const { data: orders, pending } = await useAsyncData(
  'my-orders-detail',
  () => getCustomerOrders(customer.value!.id),
  { server: false }
)

const order = computed<AppOrder | undefined>(() =>
  (orders.value ?? []).find((o) => o.id === orderId)
)

const formatPLN = (value: number) =>
  value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 })

const orderTotal = computed(() => {
  if (!order.value) return 0
  const fromItems = order.value.items.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0)
  const total = Number(order.value.total)
  return total > 0 ? total : fromItems
})

const displayEmail = computed(() =>
  order.value?.email || customer.value?.email || '—'
)

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    captured: 'Opłacone',
    paid: 'Opłacone',
    completed: 'Opłacone',
    authorized: 'Autoryzowane',
    awaiting: 'Oczekuje',
    not_paid: 'Nieopłacone',
    refunded: 'Zwrócone',
    partially_refunded: 'Częściowo zwrócone',
    canceled: 'Anulowane',
    cancelled: 'Anulowane',
    requires_action: 'Wymaga akcji'
  }
  return map[status] ?? status
}

const statusColor = (status: string) => {
  if (status === 'captured' || status === 'paid' || status === 'completed') return 'success'
  if (status === 'authorized') return 'info'
  if (status === 'awaiting' || status === 'not_paid' || status === 'requires_action') return 'warning'
  if (status === 'canceled' || status === 'cancelled') return 'error'
  return 'neutral'
}

const backUrl = '/konto/klient'

const { downloadZip } = useCustomerDownloadService()
const downloadingPlanId = ref<string | null>(null)

async function handleDownloadZip(planId: string, planTitle: string) {
  downloadingPlanId.value = planId
  try {
    await downloadZip(planId, planTitle)
  } finally {
    downloadingPlanId.value = null
  }
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <!-- Back -->
    <UButton
      variant="ghost"
      icon="i-lucide-arrow-left"
      size="sm"
      :to="backUrl"
    >
      Wróć do konta
    </UButton>

    <!-- Loading -->
    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-muted"
      />
    </div>

    <!-- Not found -->
    <UCard v-else-if="!order">
      <p class="text-center text-muted py-4">
        Nie znaleziono zamówienia.
      </p>
    </UCard>

    <template v-else>
      <!-- Order header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-default">
            Zamówienie #{{ order.id.slice(-6).toUpperCase() }}
          </h1>
          <p class="text-sm text-muted mt-1">
            {{ new Date(order.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) }}
          </p>
        </div>
        <UBadge
          :color="statusColor(order.payment_status)"
          variant="subtle"
          size="lg"
        >
          {{ statusLabel(order.payment_status) }}
        </UBadge>
      </div>

      <!-- Items -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-default">
            Produkty ({{ order.items.length }})
          </h2>
        </template>

        <div class="divide-y divide-default">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div class="space-y-1 min-w-0">
              <NuxtLink
                v-if="item.house_plan_id"
                :to="`/produkty/${item.house_plan_id}`"
                class="font-medium text-default truncate hover:text-primary transition-colors"
              >
                {{ item.title }}
              </NuxtLink>
              <p
                v-else
                class="font-medium text-default truncate"
              >
                {{ item.title }}
              </p>
              <NuxtLink
                v-if="item.vendor_name && item.vendor_id"
                :to="`/vendorzy/${item.vendor_id}`"
                class="text-sm text-muted flex items-center gap-1 hover:text-primary transition-colors w-fit"
              >
                <UIcon
                  name="i-lucide-store"
                  class="size-3.5 shrink-0"
                />
                {{ item.vendor_name }}
              </NuxtLink>
              <p
                v-else-if="item.vendor_name"
                class="text-sm text-muted flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-store"
                  class="size-3.5 shrink-0"
                />
                {{ item.vendor_name }}
              </p>
              <p class="text-sm text-muted">
                Ilość: {{ item.quantity }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <div class="text-right">
                <p class="font-semibold text-default">
                  {{ formatPLN(Number(item.unit_price) * Number(item.quantity)) }}
                </p>
                <p
                  v-if="Number(item.quantity) > 1"
                  class="text-xs text-muted"
                >
                  {{ formatPLN(Number(item.unit_price)) }} / szt.
                </p>
              </div>
              <UButton
                v-if="item.house_plan_id"
                icon="i-lucide-archive"
                size="xs"
                variant="outline"
                :loading="downloadingPlanId === item.house_plan_id"
                :disabled="downloadingPlanId !== null"
                class="cursor-pointer"
                @click="handleDownloadZip(item.house_plan_id, item.title)"
              >
                Pobierz pliki (.zip)
              </UButton>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between items-center pt-2">
            <span class="font-semibold text-default">Łącznie</span>
            <span class="text-xl font-bold text-primary">
              {{ formatPLN(orderTotal) }}
            </span>
          </div>
        </template>
      </UCard>

      <!-- Order info -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-default">
            Informacje o zamówieniu
          </h2>
        </template>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt class="text-muted">Nr zamówienia</dt>
            <dd class="font-medium text-default mt-0.5">
              #{{ order.id.slice(-6).toUpperCase() }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">Data złożenia</dt>
            <dd class="font-medium text-default mt-0.5">
              {{ new Date(order.created_at).toLocaleDateString('pl-PL') }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Status płatności
            </dt>
            <dd class="font-medium text-default mt-0.5">
              {{ statusLabel(order.payment_status) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">Email</dt>
            <dd class="font-medium text-default mt-0.5">
              {{ displayEmail }}
            </dd>
          </div>
        </dl>
      </UCard>
    </template>
  </UContainer>
</template>
