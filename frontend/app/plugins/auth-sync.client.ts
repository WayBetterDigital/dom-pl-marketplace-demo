import { VENDOR_TOKEN_KEY } from '~/composables/services/useVendorAuthService'

export const AUTH_CHANNEL = 'auth'

export default defineNuxtPlugin(() => {
  const customerState = useState<any>('auth:customer')
  const vendorState = useState<any>('auth:vendor')

  const channel = new BroadcastChannel(AUTH_CHANNEL)

  channel.addEventListener('message', (event: MessageEvent) => {
    if (event.data === 'customer-logout') {
      customerState.value = null
      navigateTo('/konto/logowanie')
    } else if (event.data === 'vendor-logout') {
      vendorState.value = null
      localStorage.removeItem(VENDOR_TOKEN_KEY)
      navigateTo('/konto/logowanie-sprzedawca')
    }
  })
})
