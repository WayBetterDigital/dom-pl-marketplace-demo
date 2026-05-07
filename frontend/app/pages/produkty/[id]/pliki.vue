<script setup lang="ts">
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import { useAuthService } from '~/composables/services/useAuthService'
import { useVendorAuthService } from '~/composables/services/useVendorAuthService'
import {
  useCustomerDownloadService
} from '~/composables/services/useCustomerDownloadService'
import {
  useFileService,
  formatFileSize,
  fileIcon,
  fileIconColor
} from '~/composables/services/useFileService'

const route = useRoute()
const id = route.params.id as string

const housePlanService = useHousePlanService()
const { customer, getSession } = useAuthService()
const { vendor, restoreSession: restoreVendorSession } = useVendorAuthService()
const { getPurchasedFiles, downloadZip: downloadZipAsCustomer } = useCustomerDownloadService()
const { getFiles, downloadZip: downloadZipAsVendor } = useFileService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

// Client-only: check vendor session, then customer session, then purchase
const { data: accessData, pending } = await useAsyncData(
  `plan-access-${id}`,
  async () => {
    // Vendor check: only the vendor who owns this plan gets direct access
    if (!vendor.value) restoreVendorSession()
    if (vendor.value && vendor.value.id === plan.value!.vendor?.id) {
      const files = await getFiles(id)
      return { type: 'vendor' as const, files, plan_title: plan.value!.title }
    }

    // Customer + purchase check
    if (!customer.value) await getSession()
    if (!customer.value) return { type: 'logged_out' as const }

    const purchased = await getPurchasedFiles(id)
    if (!purchased) return { type: 'not_purchased' as const }
    return { type: 'purchased' as const, ...purchased }
  },
  { server: false }
)

type PageState = 'loading' | 'logged_out' | 'not_purchased' | 'vendor' | 'purchased'

const pageState = computed<PageState>(() => {
  if (pending.value) return 'loading'
  return (accessData.value?.type ?? 'logged_out') as PageState
})

const files = computed(() =>
  (accessData.value && 'files' in accessData.value ? accessData.value.files : []) ?? []
)
const planTitle = computed(() =>
  (accessData.value && 'plan_title' in accessData.value
    ? accessData.value.plan_title
    : plan.value?.title) ?? ''
)

const toast = useToast()
const downloadingZip = ref(false)
async function handleDownloadZip() {
  downloadingZip.value = true
  try {
    if (pageState.value === 'vendor') {
      await downloadZipAsVendor(id, planTitle.value)
    } else {
      await downloadZipAsCustomer(id, planTitle.value)
    }
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się pobrać archiwum.', color: 'error' })
  } finally {
    downloadingZip.value = false
  }
}

async function handleDownloadFile(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Back button -->
    <div class="mb-4">
      <UButton
        to="/produkty"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
      >
        Wróć do projektów
      </UButton>
    </div>

    <!-- Tab nav -->
    <PlanTabNav
      :plan-id="id"
      class="mb-8"
    />

    <!-- Title -->
    <h1 class="text-2xl font-bold text-default mb-6">
      {{ plan?.title }}
    </h1>

    <!-- Loading -->
    <div
      v-if="pageState === 'loading'"
      class="flex justify-center py-24"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Not logged in -->
    <div
      v-else-if="pageState === 'logged_out'"
      class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center"
    >
      <UIcon
        name="i-lucide-lock"
        class="size-12 text-muted"
      />
      <div class="space-y-1">
        <p class="text-default font-medium">
          Zaloguj się, aby pobrać pliki projektu
        </p>
        <p class="text-sm text-muted">
          Pliki są dostępne wyłącznie dla klientów, którzy zakupili ten projekt.
        </p>
      </div>
      <UButton
        to="/konto/logowanie-klient"
        icon="i-lucide-log-in"
      >
        Zaloguj się
      </UButton>
    </div>

    <!-- Logged in but not purchased -->
    <div
      v-else-if="pageState === 'not_purchased'"
      class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center"
    >
      <UIcon
        name="i-lucide-shopping-cart"
        class="size-12 text-muted"
      />
      <div class="space-y-1">
        <p class="text-default font-medium">
          Kup projekt, aby pobrać pliki
        </p>
        <p class="text-sm text-muted">
          Po zakupie uzyskasz dostęp do wszystkich plików projektu.
        </p>
      </div>
      <UButton
        :to="`/produkty/${id}`"
        icon="i-lucide-shopping-bag"
      >
        Kup projekt
      </UButton>
    </div>

    <!-- Vendor or purchased: show files -->
    <template v-else-if="pageState === 'vendor' || pageState === 'purchased'">
      <!-- ZIP download -->
      <div v-if="files.length" class="flex justify-end mb-4">
        <UButton
          icon="i-lucide-archive"
          variant="outline"
          :loading="downloadingZip"
          :disabled="downloadingZip"
          class="cursor-pointer"
          @click="handleDownloadZip"
        >
          Pobierz wszystko (.zip)
        </UButton>
      </div>

      <!-- Empty state -->
      <div
        v-if="!files.length"
        class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center"
      >
        <UIcon
          name="i-lucide-folder-open"
          class="size-12 text-muted"
        />
        <p class="text-default font-medium">
          Brak plików
        </p>
      </div>

      <!-- File list -->
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <div
          v-for="file in files"
          :key="file.id"
          class="group flex items-center gap-4 px-4 py-3 rounded-xl border border-default hover:bg-muted/50 transition-colors"
        >
          <UIcon
            :name="fileIcon(file.mime_type)"
            :class="['size-8 shrink-0', fileIconColor(file.mime_type)]"
          />

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-default truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-muted">
              {{ formatFileSize(file.size) }}
            </p>
          </div>

          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton
              icon="i-lucide-download"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Pobierz"
              class="cursor-pointer"
              @click="handleDownloadFile(file.url, file.name)"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
