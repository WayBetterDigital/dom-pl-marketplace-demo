<script setup lang="ts">
import { useAsyncData } from '#imports'
import {
  useSketchService,
  floorLabel,
  FLOOR_OPTIONS,
  TYPE_OPTIONS,
} from '~/composables/services/useSketchService'
import type { HousePlanSketch, SketchType } from '~/composables/services/useSketchService'
import { usePlanMirror } from '~/composables/usePlanMirror'

const props = defineProps<{ planId: string }>()

const toast = useToast()
const { getSketches, createSketch, updateSketch, deleteSketch } = useSketchService()
const { mirrored } = usePlanMirror()

const { data: sketches, refresh } = await useAsyncData(
  `sketches-${props.planId}`,
  () => getSketches(props.planId),
  { server: false }
)

const sketchesByFloor = computed(() => {
  const all = sketches.value ?? []
  const floors = [...new Set(all.map(s => s.floor))].sort((a, b) => a - b)
  return floors.map(floor => ({
    floor,
    label: floorLabel(floor),
    base: all.find(s => s.floor === floor && s.type === 0) ?? null,
    withLabels: all.find(s => s.floor === floor && s.type === 1) ?? null,
  }))
})

const showLabels = reactive<Record<number, boolean>>({})

function toggleLabels(floor: number) {
  showLabels[floor] = !showLabels[floor]
}

function activeUrl(floor: number, group: { base: any; withLabels: any }) {
  if (showLabels[floor] && group.withLabels) return group.withLabels.url
  return group.base?.url ?? group.withLabels?.url ?? ''
}

const isModalOpen = ref(false)
const editingSketch = ref<HousePlanSketch | null>(null)
const formFile = ref<File | null>(null)
const formPreview = ref<string | null>(null)
const formFloor = ref('0')
const formType = ref('0')
const formError = ref('')
const formSubmitting = ref(false)

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    formError.value = 'Plik jest za duży (maks. 10 MB)'
    return
  }
  formFile.value = file
  if (formPreview.value) URL.revokeObjectURL(formPreview.value)
  formPreview.value = URL.createObjectURL(file)
}

function openAdd() {
  editingSketch.value = null
  formFile.value = null
  formPreview.value = null
  formFloor.value = '0'
  formType.value = '0'
  formError.value = ''
  isModalOpen.value = true
}

function openEdit(sketch: HousePlanSketch) {
  editingSketch.value = sketch
  formFile.value = null
  formPreview.value = null
  formFloor.value = String(sketch.floor)
  formType.value = String(sketch.type)
  formError.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  if (formPreview.value) URL.revokeObjectURL(formPreview.value)
  formPreview.value = null
  formFile.value = null
}

async function submitForm() {
  if (!editingSketch.value && !formFile.value) {
    formError.value = 'Wybierz plik szkicu'
    return
  }
  formSubmitting.value = true
  formError.value = ''
  try {
    if (editingSketch.value) {
      await updateSketch(props.planId, editingSketch.value.id, {
        file: formFile.value ?? undefined,
        floor: Number(formFloor.value),
        type: Number(formType.value) as SketchType,
      })
      toast.add({ title: 'Szkic zaktualizowany', color: 'success' })
    } else {
      await createSketch(props.planId, {
        file: formFile.value!,
        floor: Number(formFloor.value),
        type: Number(formType.value) as SketchType,
      })
      toast.add({ title: 'Szkic dodany', color: 'success' })
    }
    isModalOpen.value = false
    await refresh()
  } catch (err: any) {
    formError.value = err?.data?.message || err?.message || 'Wystąpił błąd'
  } finally {
    formSubmitting.value = false
  }
}

const deleteSubmitting = ref(false)

async function handleDelete(sketch: HousePlanSketch) {
  if (!confirm(`Usunąć szkic "${floorLabel(sketch.floor)}"?`)) return
  deleteSubmitting.value = true
  try {
    await deleteSketch(props.planId, sketch.id)
    await refresh()
    toast.add({ title: 'Szkic usunięty', color: 'success' })
  } catch {
    toast.add({ title: 'Błąd', description: 'Nie udało się usunąć szkicu.', color: 'error' })
  } finally {
    deleteSubmitting.value = false
  }
}

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-default">
        Rzuty kondygnacji
      </h2>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        variant="outline"
        @click="openAdd"
      >
        Dodaj szkic
      </UButton>
    </div>

    <!-- Empty state -->
    <div
      v-if="!sketchesByFloor.length"
      class="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-default rounded-xl text-center"
    >
      <UIcon name="i-lucide-layout-panel-top" class="size-10 text-muted" />
      <p class="text-sm text-muted">
        Brak rzutów kondygnacji.
      </p>
    </div>

    <!-- Sketches by floor -->
    <div
      v-for="group in sketchesByFloor"
      :key="group.floor"
      class="flex flex-col gap-3"
    >
      <h3 class="text-base font-medium text-muted">
        {{ group.label }}
      </h3>

      <div class="relative aspect-video w-full rounded-xl overflow-hidden border border-default">
        <img
          :src="activeUrl(group.floor, group)"
          :alt="group.label"
          class="w-full h-full object-contain transition-transform duration-300"
          :style="mirrored ? 'transform: scaleX(-1)' : ''"
        >

        <div class="absolute top-2 left-2 z-10 flex gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity [.group:hover_&]:opacity-100">
        </div>
        <div class="absolute inset-0 group">
          <div class="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <!-- Edit base sketch -->
            <button
              v-if="group.base"
              type="button"
              title="Edytuj rzut"
              class="size-7 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center cursor-pointer shadow transition-colors"
              @click="openEdit(group.base)"
            >
              <UIcon name="i-lucide-pencil" class="size-3.5" />
            </button>
            <!-- Edit withLabels sketch -->
            <button
              v-if="group.withLabels"
              type="button"
              title="Edytuj rzut z opisami"
              class="size-7 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center cursor-pointer shadow transition-colors"
              @click="openEdit(group.withLabels)"
            >
              <UIcon name="i-lucide-tag" class="size-3.5" />
            </button>
            <!-- Delete active sketch -->
            <button
              v-if="group.base || group.withLabels"
              type="button"
              title="Usuń widoczny szkic"
              class="size-7 rounded-full bg-red-500/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow transition-colors"
              :disabled="deleteSubmitting"
              @click="handleDelete((showLabels[group.floor] && group.withLabels) ? group.withLabels : (group.base ?? group.withLabels!))"
            >
              <UIcon name="i-lucide-trash-2" class="size-3.5" />
            </button>
          </div>
        </div>

        <div class="absolute bottom-2 right-2 z-10 flex gap-2">
          <button
            v-if="group.withLabels"
            type="button"
            :aria-label="showLabels[group.floor] ? 'Ukryj opisy pomieszczeń' : 'Pokaż opisy pomieszczeń'"
            :class="[
              'size-9 rounded-full shadow flex items-center justify-center transition-all cursor-pointer',
              showLabels[group.floor]
                ? 'bg-primary text-white opacity-100'
                : 'bg-white/85 text-gray-800 opacity-70 hover:opacity-100'
            ]"
            @click="toggleLabels(group.floor)"
          >
            <UIcon name="i-lucide-tag" class="size-5" />
          </button>

          <!-- Mirror -->
          <button
            type="button"
            :aria-label="mirrored ? 'Wyłącz odbicie lustrzane' : 'Włącz odbicie lustrzane'"
            :class="[
              'size-9 rounded-full shadow flex items-center justify-center transition-all cursor-pointer',
              mirrored
                ? 'bg-primary text-white opacity-100'
                : 'bg-white/85 text-gray-800 opacity-70 hover:opacity-100'
            ]"
            @click="mirrored = !mirrored"
          >
            <UIcon name="i-lucide-flip-horizontal-2" class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="editingSketch ? 'Edytuj szkic' : 'Dodaj szkic'"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4 p-1">
          <!-- Preview -->
          <div
            v-if="formPreview || editingSketch?.url"
            class="aspect-video rounded-lg overflow-hidden border border-default bg-muted"
          >
            <img
              :src="formPreview ?? editingSketch?.url"
              alt=""
              class="w-full h-full object-contain"
            >
          </div>

          <!-- File picker -->
          <div class="space-y-1">
            <label class="text-sm font-medium text-default">
              {{ editingSketch ? 'Zastąp plik (opcjonalnie)' : 'Plik szkicu *' }}
            </label>
            <label class="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              >
              <div class="flex items-center gap-2 border border-dashed border-default rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors">
                <UIcon name="i-lucide-image-plus" class="size-5 text-muted shrink-0" />
                <span class="text-sm text-muted">
                  {{ formFile ? formFile.name : 'Wybierz plik...' }}
                </span>
              </div>
            </label>
            <p class="text-xs text-muted">
              JPG, PNG, WebP · maks. 10 MB
            </p>
          </div>

          <!-- Floor -->
          <div class="space-y-1">
            <label class="text-sm font-medium text-default">Kondygnacja</label>
            <USelect
              v-model="formFloor"
              :items="FLOOR_OPTIONS"
              value-key="value"
              label-key="label"
            />
          </div>

          <!-- Type -->
          <div class="space-y-1">
            <label class="text-sm font-medium text-default">Typ</label>
            <USelect
              v-model="formType"
              :items="TYPE_OPTIONS"
              value-key="value"
              label-key="label"
            />
          </div>

          <!-- Error -->
          <p
            v-if="formError"
            class="text-sm text-red-500"
          >
            {{ formError }}
          </p>
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeModal"
        >
          Anuluj
        </UButton>
        <UButton
          :loading="formSubmitting"
          @click="submitForm"
        >
          {{ editingSketch ? 'Zapisz' : 'Dodaj' }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>
