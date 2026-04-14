// Wspólny stan odbicia lustrzanego dla galerii i szkiców na stronie detalu planu
export function usePlanMirror() {
  const mirrored = useState('plan-mirror', () => false)

  onUnmounted(() => {
    mirrored.value = false
  })

  return { mirrored }
}
