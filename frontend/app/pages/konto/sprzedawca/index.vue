<script setup lang="ts">
definePageMeta({ middleware: 'vendor-auth' })
import type { TableColumn } from '@nuxt/ui'
import { useVendorService } from '~/composables/services/useVendorService'
import { useVendorAuthService } from '~/composables/services/useVendorAuthService'
import type { AppOrder } from '~/types/order'

type OrderRow = {
  id: string
  orderId: string
  products: string
  buyer: string
  date: string
  status: string
  amount: string
}

const route = useRoute()
const toast = useToast()
const { vendor: vendorSession, logout } = useVendorAuthService()
const vendorId = computed(() => (route.query.id as string) || vendorSession.value?.id || '')

async function handleLogout() {
  logout()
  await navigateTo('/konto/logowanie')
}
const {
  getVendor,
  getVendorHousePlans,
  getVendorOrders,
  deleteVendorHousePlan,
} = useVendorService()

const { data: vendorData } = await useAsyncData(
  () => `vendor-${vendorId.value}`,
  () => getVendor(vendorId.value),
  { server: false, watch: [vendorId] }
)

const { data: ordersData, pending: ordersPending } = useAsyncData(
  () => `vendor-orders-${vendorId.value}`,
  () => getVendorOrders(vendorId.value),
  { server: false, watch: [vendorId] }
)

const vendor = computed(() => ({
  name: vendorData.value
    ? `${vendorData.value.first_name} ${vendorData.value.last_name}`
    : '—',
  company: vendorData.value?.company_name ?? '—',
  createdAt: vendorData.value?.created_at
    ? vendorData.value.created_at.slice(0, 10).split('-').reverse().join('.')
    : '—'
}))

const formatPLN = (value: number) =>
  value.toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  })

const ordersCount = computed(() => ordersData.value?.length ?? 0)

const stats = computed(() => [
  {
    label: 'Plany domów',
    value: String(vendorData.value?.house_plans_count ?? '—'),
    icon: 'i-lucide-layout-template',
    trend: ''
  },
  {
    label: 'Zamówienia',
    value: String(ordersCount.value),
    icon: 'i-lucide-shopping-bag',
    trend: ''
  },
  {
    label: 'Przychód',
    value: ordersData.value
      ? formatPLN(ordersData.value.reduce((sum, o) => sum + Number(o.total), 0))
      : '—',
    icon: 'i-lucide-banknote',
    trend: ''
  },
  {
    label: 'Średnia ocena',
    value:
      vendorData.value?.average_rating != null
        ? String(vendorData.value.average_rating)
        : '—',
    icon: 'i-lucide-star',
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
    const itemTotal = o.items.reduce(
      (sum, i) => sum + Number(i.unit_price) * Number(i.quantity),
      0
    )
    const total = Number(o.total)
    return {
      id: '#' + o.id.slice(-6).toUpperCase(),
      orderId: o.id,
      products:
        o.items.length === 1
          ? (o.items[0]?.title ?? '—')
          : `${o.items.length} produkty`,
      buyer: o.email ?? '—',
      date: new Date(o.created_at).toLocaleDateString('pl-PL'),
      status: statusLabel(o.status),
      amount: formatPLN(total > 0 ? total : itemTotal)
    }
  })
)

const { data: housePlansData } = await useAsyncData(
  () => `vendor-house-plans-${vendorId.value}`,
  () => getVendorHousePlans(vendorId.value),
  { server: false, watch: [vendorId] }
)

const myPlans = computed(() =>
  (housePlansData.value ?? []).map(plan => ({
    id: plan.id,
    title: plan.title,
    price: formatPLN(plan.price)
  }))
)

async function deletePlan(planId: string) {
  if (!confirm('Czy na pewno chcesz usunąć ten plan?')) return
  try {
    await deleteVendorHousePlan(vendorId.value, planId)
    toast.add({ title: 'Plan usunięty', color: 'success' })
    await Promise.all([
      refreshNuxtData(`vendor-${vendorId.value}`),
      refreshNuxtData(`vendor-house-plans-${vendorId.value}`)
    ])
  } catch {
    toast.add({
      title: 'Błąd',
      description: 'Nie udało się usunąć planu.',
      color: 'error'
    })
  }
}

const orderColumns: TableColumn<OrderRow>[] = [
  { accessorKey: 'id', header: 'Nr' },
  { accessorKey: 'products', header: 'Produkt(y)' },
  { accessorKey: 'buyer', header: 'Kupujący' },
  { accessorKey: 'date', header: 'Data' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Kwota' },
  { accessorKey: 'actions', header: '' }
]

const statusColor = (status: string) => {
  if (status === 'Opłacone') return 'success'
  if (status === 'Oczekuje') return 'warning'
  if (status === 'Anulowane') return 'error'
  return 'neutral'
}
</script>

<template>
  <div>
    <UContainer class="py-8 space-y-8">
      <!-- Header -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-4">
          <UAvatar
            :alt="vendor.name"
            size="xl"
            icon="i-lucide-user"
          />
          <div>
            <h1 class="text-2xl font-bold text-default">
              {{ vendor.company }}
            </h1>
            <p class="text-sm text-muted">
              {{ vendor.name }} · Sprzedawca od {{ vendor.createdAt }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-plus"
            size="sm"
            class="cursor-pointer"
            :to="`/konto/sprzedawca/plan/nowy?vendorId=${vendorId}`"
          >
            Dodaj plan
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
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <!-- Main grid -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <!-- Recent orders -->
        <div class="space-y-3 xl:col-span-2">
          <h2 class="text-lg font-semibold text-default">
            Ostatnie zamówienia
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
                  <UButton
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-eye"
                    :to="`/konto/sprzedawca/zamowienie/${row.original.orderId}?vendorId=${vendorId}`"
                  >
                    Szczegóły
                  </UButton>
                </template>
              </UTable>
            </UCard>
          </template>

          <UCard v-else>
            <p class="text-sm text-muted text-center py-4">
              Brak zamówień na Twoje plany.
            </p>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- My plans -->
          <div class="space-y-3">
            <h2 class="text-lg font-semibold text-default">
              Moje plany
            </h2>
            <UCard>
              <p
                v-if="!myPlans.length"
                class="text-sm text-muted"
              >
                Nie masz jeszcze żadnych planów.
              </p>
              <ul
                v-else
                class="divide-y divide-default"
              >
                <li
                  v-for="plan in myPlans"
                  :key="plan.id"
                  class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <NuxtLink
                    :to="`/produkty/${plan.id}`"
                    class="min-w-0 flex-1 group"
                  >
                    <p
                      class="truncate text-sm font-medium text-default group-hover:text-primary transition-colors"
                    >
                      {{ plan.title }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ plan.price }}
                    </p>
                  </NuxtLink>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    size="xs"
                    class="cursor-pointer shrink-0 ml-1"
                    :to="`/konto/sprzedawca/plan/${plan.id}?vendorId=${vendorId}`"
                  />
                  <UButton
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    size="xs"
                    class="cursor-pointer shrink-0 ml-2"
                    @click="deletePlan(plan.id)"
                  />
                </li>
              </ul>
            </UCard>
          </div>

          <!-- Quick actions -->
          <div class="space-y-3">
            <h2 class="text-lg font-semibold text-default">
              Szybkie akcje
            </h2>
            <UCard>
              <div class="space-y-2">
                <UButton
                  block
                  variant="soft"
                  icon="i-lucide-layout-template"
                  :to="`/konto/sprzedawca/plan/nowy?vendorId=${vendorId}`"
                >
                  Nowy plan domu
                </UButton>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </UContainer>

  </div>
</template>
