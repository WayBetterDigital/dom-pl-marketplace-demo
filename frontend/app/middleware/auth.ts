import { useAuthService } from '~/composables/services/useAuthService'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { customer, getSession } = useAuthService()
  if (!customer.value) {
    await getSession()
  }
  if (!customer.value) {
    return navigateTo('/konto/logowanie-klient')
  }
})
