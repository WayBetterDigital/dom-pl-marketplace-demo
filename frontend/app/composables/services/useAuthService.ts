import { useMedusaClient } from '#imports'
import { mapToAppCustomer } from '~/utils/mappers/customerMapper'
import type { AppCustomer } from '~/types/customer'

export function useAuthService() {
  const sdk = useMedusaClient()
  const customer = useState<AppCustomer | null>('auth:customer', () => null)

  async function login(email: string, password: string): Promise<void> {
    const result = await sdk.auth.login('customer', 'emailpass', { email, password })
    if (typeof result !== 'string') {
      throw new Error('Nieprawidłowy e-mail lub hasło')
    }
    const { customer: raw } = await sdk.store.customer.retrieve()
    customer.value = mapToAppCustomer(raw as any)
  }

  async function register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const token = await sdk.auth.register('customer', 'emailpass', { email, password })
    await sdk.store.customer.create(
      { email, first_name: firstName, last_name: lastName },
      {},
      { Authorization: `Bearer ${token}` }
    )
    await login(email, password)
  }

  async function logout(): Promise<void> {
    await sdk.auth.logout()
    customer.value = null
    if (import.meta.client) {
      new BroadcastChannel('auth').postMessage('customer-logout')
    }
  }

  async function getSession(): Promise<AppCustomer | null> {
    try {
      const { customer: raw } = await sdk.store.customer.retrieve()
      customer.value = mapToAppCustomer(raw as any)
      return customer.value
    } catch {
      customer.value = null
      return null
    }
  }

  return { customer, login, register, logout, getSession }
}
