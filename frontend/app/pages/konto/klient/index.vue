<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useCustomerService } from '~/composables/services/useCustomerService'
import { useAuthService } from '~/composables/services/useAuthService'
import { useCustomerDownloadService } from '~/composables/services/useCustomerDownloadService'
import type { AppOrder } from '~/types/order'

definePageMeta({ middleware: 'auth' })

type OrderRow = {
  id: string
  orderId: string
  products: string
  date: string
  status: string
  amount: string
  plans: { id: string; title: string }[]
}

const { customer, logout } = useAuthService()
const { getCustomerOrders } = useCustomerService()
const { downloadZip } = useCustomerDownloadService()
const toast = useToast()

const downloadingPlanId = ref<string | null>(null)

async function handleDownloadZip(planId: string, planTitle: string) {
  downloadingPlanId.value = planId
  try {
    await downloadZip(planId, planTitle)
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się pobrać archiwum.', color: 'error' })
  } finally {
    downloadingPlanId.value = null
  }
}

async function handleLogout() {
  await logout()
  await navigateTo('/konto/logowanie')
}

const { data: ordersData, pending: ordersPending } = useAsyncData(
  'my-orders',
  () => getCustomerOrders(customer.value!.id),
  { server: false }
)

const customerDisplay = computed(() => ({
  name: customer.value ? `${customer.value.first_name} ${customer.value.last_name}` : '—',
  email: customer.value?.email ?? '—',
  since: customer.value?.created_at
    ? new Date(customer.value.created_at).getFullYear().toString()
    : '—'
}))

const formatPLN = (value: number) =>
  value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })

const totalSpent = computed(() =>
  (ordersData.value ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)
)

const stats = computed(() => [
  {
    label: 'Zamówienia',
    value: String(ordersData.value?.length ?? '—'),
    icon: 'i-lucide-shopping-bag',
    trend: ''
  },
  {
    label: 'Wydane łącznie',
    value: ordersData.value ? formatPLN(totalSpent.value) : '—',
    icon: 'i-lucide-banknote',
    trend: ''
  }
])

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    completed: 'Opłacone',
    pending: 'Oczekuje',
    cancelled: 'Anulowane',
    canceled: 'Anulowane',
    requires_action: 'Wymaga akcji'
  }
  return map[status] ?? status
}

const recentOrders = computed<OrderRow[]>(() =>
  (ordersData.value ?? []).slice(0, 10).map((o: AppOrder) => {
    const itemTotal = o.items.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0)
    const total = Number(o.total)
    const seen = new Set<string>()
    const plans: { id: string, title: string }[] = []
    for (const item of o.items) {
      if (item.house_plan_id && !seen.has(item.house_plan_id)) {
        seen.add(item.house_plan_id)
        plans.push({ id: item.house_plan_id, title: item.title })
      }
    }
    return {
      id: '#' + o.id.slice(-6).toUpperCase(),
      orderId: o.id,
      products: o.items.length === 1
        ? (o.items[0]?.title ?? '—')
        : `${o.items.length} produkty`,
      date: new Date(o.created_at).toLocaleDateString('pl-PL'),
      status: statusLabel(o.status),
      amount: formatPLN(total > 0 ? total : itemTotal),
      plans
    }
  })
)

const orderColumns: TableColumn<OrderRow>[] = [
  { accessorKey: 'id', header: 'Nr' },
  { accessorKey: 'products', header: 'Produkt(y)' },
  { accessorKey: 'date', header: 'Data' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Kwota' },
  { accessorKey: 'actions', header: '' }
]

const statusColor = (status: string) => {
  if (status === 'Opłacone') return 'success'
  if (status === 'Oczekuje') return 'warning'
  if (status === 'Anulowane' || status === 'canceled' || status === 'cancelled') return 'error'
  return 'neutral'
}
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <UAvatar
          :alt="customerDisplay.name"
          size="xl"
          icon="i-lucide-user"
        />
        <div>
          <h1 class="text-2xl font-bold text-default">
            {{ customerDisplay.name }}
          </h1>
          <p class="text-sm text-muted">
            {{ customerDisplay.email }} · Konto od {{ customerDisplay.since }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          variant="outline"
          icon="i-lucide-layout-template"
          size="sm"
          class="cursor-pointer"
          to="/produkty"
        >
          Przeglądaj plany
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-log-out"
          size="sm"
          class="cursor-pointer"
          @click="handleLogout"
        >
          Wyloguj się
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <p class="text-sm text-muted">
              {{ stat.label }}
            </p>
            <p class="text-2xl font-bold text-default">
              {{ stat.value }}
            </p>
          </div>
          <div class="rounded-lg bg-primary/10 p-2">
            <UIcon
              :name="stat.icon"
              class="size-5 text-primary"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Orders -->
    <div class="space-y-3">
      <h2 class="text-lg font-semibold text-default">
        Moje zamówienia
      </h2>

      <div
        v-if="ordersPending"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <template v-else-if="recentOrders.length">
        <UCard :ui="{ body: 'p-0' }">
          <UTable
            :columns="orderColumns"
            :data="recentOrders"
          >
            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="subtle"
                size="sm"
              >
                {{ row.original.status }}
              </UBadge>
            </template>
            <template #amount-cell="{ row }">
              <span class="font-medium text-default">
                {{ row.original.amount }}
              </span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  v-for="plan in row.original.plans"
                  :key="plan.id"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-archive"
                  :loading="downloadingPlanId === plan.id"
                  :disabled="downloadingPlanId !== null"
                  class="cursor-pointer"
                  @click="handleDownloadZip(plan.id, plan.title)"
                >
                  Pobierz
                </UButton>
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-eye"
                  :to="`/konto/klient/zamowienie/${row.original.orderId}`"
                >
                  Szczegóły
                </UButton>
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <UCard v-else>
        <p class="text-sm text-muted text-center py-4">
          Nie masz jeszcze żadnych zamówień.
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
