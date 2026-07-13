export type OverlayMode = 'partial' | 'full'

export const useSiteOverlay = () => {
  const isOverlayVisible = useState<boolean>('overlay', () => false)
  const overlayMode = useState<OverlayMode>('overlay_mode', () => 'partial')

  const showOverlay = (mode: OverlayMode = 'partial') => {
    overlayMode.value = mode
    isOverlayVisible.value = true
  }

  const hideOverlay = () => {
    isOverlayVisible.value = false
  }

  const toggleOverlay = (mode: OverlayMode = 'partial') => {
    if (isOverlayVisible.value) {
      hideOverlay()
    } else {
      showOverlay(mode)
    }
  }

  return {
    isOverlayVisible,
    overlayMode,
    showOverlay,
    hideOverlay,
    toggleOverlay,
  }
}
