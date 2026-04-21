import { useVendorAuthService } from '~/composables/services/useVendorAuthService'

export default defineNuxtRouteMiddleware(() => {
  const { vendor, restoreSession } = useVendorAuthService()

  if (!vendor.value) {
    restoreSession()
  }

  if (!vendor.value) {
    return navigateTo('/konto/logowanie-sprzedawca')

  }
})
