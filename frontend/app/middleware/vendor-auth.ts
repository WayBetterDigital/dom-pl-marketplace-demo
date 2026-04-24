import { useVendorAuthService } from '~/composables/services/useVendorAuthService'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const { vendor, restoreSession } = useVendorAuthService()
  if (!vendor.value) {
    restoreSession()
  }
  if (!vendor.value) {
    return navigateTo('/konto/logowanie-sprzedawca')
  }
})
