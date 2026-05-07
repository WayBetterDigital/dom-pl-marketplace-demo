import { useMedusaClient } from '#imports'

export const VENDOR_TOKEN_KEY = 'vendor_auth_token'

export type AppVendorSession = {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name: string
}

export function useVendorAuthService() {
  const sdk = useMedusaClient()
  const vendor = useState<AppVendorSession | null>('auth:vendor', () => null)

  async function register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    companyName: string,
  ): Promise<void> {
    let response: { vendor: AppVendorSession; token: string }
    try {
      response = await sdk.client.fetch<{ vendor: AppVendorSession; token: string }>(
        '/store/vendors/register',
        { method: 'POST', body: { email, password, first_name: firstName, last_name: lastName, company_name: companyName } }
      )
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Nie udało się utworzyć konta'
      throw new Error(msg)
    }
    localStorage.setItem(VENDOR_TOKEN_KEY, response.token)
    vendor.value = response.vendor
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await sdk.client.fetch<{ vendor: AppVendorSession; token: string }>(
      '/store/vendors/login',
      { method: 'POST', body: { email, password } }
    )
    localStorage.setItem(VENDOR_TOKEN_KEY, response.token)
    vendor.value = response.vendor
  }

  function logout(): void {
    if (import.meta.client) {
      localStorage.removeItem(VENDOR_TOKEN_KEY)
      new BroadcastChannel('auth').postMessage('vendor-logout')
    }
    vendor.value = null
  }

  function restoreSession(): AppVendorSession | null {
    if (import.meta.server) return null
    const token = localStorage.getItem(VENDOR_TOKEN_KEY)
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]!))
      if (payload.exp * 1000 < Date.now()) {
        logout()
        return null
      }
      vendor.value = {
        id: payload.vendor_id,
        email: payload.email,
        first_name: payload.first_name ?? '',
        last_name: payload.last_name ?? '',
        company_name: payload.company_name ?? '',
      }
      return vendor.value
    } catch {
      logout()
      return null
    }
  }

  return { vendor, login, register, logout, restoreSession }
}
