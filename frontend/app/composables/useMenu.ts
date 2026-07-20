export const useMenu = () => {
  const isMenuOpen = useState<boolean>('menu_open', () => false)
  const { showOverlay, hideOverlay } = useSiteOverlay()

  const openMenu = () => {
    isMenuOpen.value = true
    showOverlay('full')
  }

  const closeMenu = () => {
    isMenuOpen.value = false
    hideOverlay()
  }

  const toggleMenu = () => {
    if (isMenuOpen.value) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  return {
    isMenuOpen,
    openMenu,
    closeMenu,
    toggleMenu,
  }
}
