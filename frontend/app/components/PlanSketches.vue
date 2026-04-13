<script setup lang="ts">
import { useAsyncData } from '#imports'
import { useSketchService, floorLabel } from '~/composables/services/useSketchService'

const props = defineProps<{ planId: string }>()

const { getSketches } = useSketchService()
const { mirrored } = usePlanMirror()

const { data: sketches } = await useAsyncData(
  `sketches-${props.planId}`,
  () => getSketches(props.planId)
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
</script>

<template>
  <div
    v-if="sketchesByFloor.length"
    class="flex flex-col gap-6"
  >
    <h2 class="text-xl font-semibold text-default">
      Rzuty kondygnacji
    </h2>

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

        <!-- Przyciski w prawym dolnym rogu — taki sam styl jak w galerii -->
        <div class="absolute bottom-2 right-2 z-10 flex gap-2">
          <!-- Pokaż/ukryj opisy pomieszczeń -->
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
            <UIcon
              name="i-lucide-tag"
              class="size-5"
            />
          </button>

          <!-- Odbij lustrzanie (wspólny stan z galerią) -->
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
            <UIcon
              name="i-lucide-flip-horizontal-2"
              class="size-5"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
