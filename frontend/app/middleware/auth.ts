import { useAuthService } from '~/composables/services/useAuthService'

export default defineNuxtRouteMiddleware(async () => {
  const { getSession } = useAuthService()
  const customer = await getSession()

  if (!customer) {
    return navigateTo('/konto/logowanie')
  }
})
