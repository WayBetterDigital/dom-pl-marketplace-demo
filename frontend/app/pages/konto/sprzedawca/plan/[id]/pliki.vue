<script setup lang="ts">
definePageMeta({ middleware: 'vendor-auth' })
import { useRoute, useAsyncData, createError } from '#imports'
import { useHousePlanService } from '~/composables/services/useHousePlanService'
import {
  useFileService,
  formatFileSize,
  fileIcon,
  fileIconColor
} from '~/composables/services/useFileService'

const route = useRoute()
const id = route.params.id as string
const vendorId = route.query.vendorId as string
const toast = useToast()

const housePlanService = useHousePlanService()
const { getFiles, uploadFile, deleteFile, downloadZip } = useFileService()

const { data: plan, error } = await useAsyncData(
  `house-plan-${id}`,
  () => housePlanService.getHousePlan(id)
)

if (error.value || !plan.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projekt nie znaleziony', fatal: true })
}

const { data: files, refresh } = await useAsyncData(
  `plan-files-${id}`,
  () => getFiles(id)
)

const uploadingFiles = ref<{ name: string, progress: boolean }[]>([])
const deletingId = ref<string | null>(null)
const downloadingZip = ref(false)
const isUploading = computed(() => uploadingFiles.value.length > 0)

async function handleDownloadZip() {
  downloadingZip.value = true
  try {
    await downloadZip(id, plan.value?.title ?? id)
  } finally {
    downloadingZip.value = false
  }
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  input.value = ''
  if (!selected.length) return
  for (const file of selected) {
    if (file.size > 35 * 1024 * 1024) {
      toast.add({
        title: 'Plik jest za duży',
        description: `${file.name} przekracza limit 35 MB.`,
        color: 'warning'
      })
      continue
    }
    uploadingFiles.value.push({ name: file.name, progress: true })
    try {
      await uploadFile(id, file)
      toast.add({ title: 'Plik dodany', description: file.name, color: 'success' })
    } catch {
      toast.add({ title: 'Błąd', description: `Nie udało się wgrać ${file.name}`, color: 'error' })
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(f => f.name !== file.name)
    }
  }
  await refresh()
}

async function handleDownload(url: string, name: string) {
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

async function handleDelete(fileId: string, fileName: string) {
  if (!confirm(`Usunąć plik "${fileName}"?`)) return
  deletingId.value = fileId
  try {
    await deleteFile(id, fileId)
    await refresh()
    toast.add({ title: 'Plik usunięty', color: 'success' })
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć pliku.', color: 'error' })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <div class="mb-4">
      <UButton :to="`/konto/sprzedawca?id=${vendorId}`" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
        Wróć do panelu sprzedawcy
      </UButton>
    </div>

    <VendorPlanTabNav :plan-id="id" :vendor-id="vendorId" class="mb-8" />

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-default">
        {{ plan?.title }}
      </h1>
      <div class="flex items-center gap-2">
        <UButton
          v-if="files?.length"
          icon="i-lucide-archive"
          size="sm"
          variant="outline"
          :loading="downloadingZip"
          :disabled="downloadingZip"
          class="cursor-pointer"
          @click="handleDownloadZip"
        >
          Pobierz wszystko (.zip)
        </UButton>
        <label class="cursor-pointer">
          <input type="file" multiple class="hidden" @change="handleFileChange">
          <UButton as="span" icon="i-lucide-upload" size="sm" :loading="isUploading">Wgraj pliki</UButton>
        </label>
      </div>
    </div>

    <div v-if="uploadingFiles.length" class="flex flex-col gap-2 mb-4">
      <div
        v-for="f in uploadingFiles"
        :key="f.name"
        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-default bg-muted/50 animate-pulse"
      >
        <UIcon name="i-lucide-loader-circle" class="size-5 text-muted animate-spin shrink-0" />
        <span class="text-sm text-muted truncate">Wgrywanie: {{ f.name }}</span>
      </div>
    </div>

    <div v-if="!files?.length && !isUploading" class="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-default rounded-xl text-center">
      <UIcon name="i-lucide-folder-open" class="size-12 text-muted" />
      <div>
        <p class="text-default font-medium">Brak plików</p>
        <p class="text-sm text-muted mt-1">Kliknij "Wgraj pliki" żeby dodać pierwszy plik.</p>
      </div>
    </div>

    <div v-else-if="files?.length" class="flex flex-col gap-2">
      <div
        v-for="file in files"
        :key="file.id"
        class="group flex items-center gap-4 px-4 py-3 rounded-xl border border-default hover:bg-muted/50 transition-colors"
      >
        <UIcon :name="fileIcon(file.mime_type)" :class="['size-8 shrink-0', fileIconColor(file.mime_type)]" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-default truncate">{{ file.name }}</p>
          <p class="text-xs text-muted">{{ formatFileSize(file.size) }}</p>
        </div>
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <UButton icon="i-lucide-download" size="xs" color="neutral" variant="ghost" class="cursor-pointer" @click="handleDownload(file.url, file.name)" />
          <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" :loading="deletingId === file.id" class="cursor-pointer" @click="handleDelete(file.id, file.name)" />
        </div>
      </div>
    </div>
  </div>
</template>
