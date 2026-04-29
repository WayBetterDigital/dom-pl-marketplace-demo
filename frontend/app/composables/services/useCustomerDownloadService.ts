import { useMedusaClient, useRuntimeConfig } from '#imports'
import type { HousePlanFile } from './useFileService'

export interface PurchasedFilesResult {
  files: HousePlanFile[]
  plan_title: string
}

export function useCustomerDownloadService() {
  const sdk = useMedusaClient()
  const config = useRuntimeConfig()
  const clientBaseUrl = (config.public.medusa as any).baseUrl as string
  const publishableKey = (config.public.medusa as any).publishableKey as string

  async function getPurchasedFiles(planId: string): Promise<PurchasedFilesResult | null> {
    try {
      return await sdk.client.fetch<PurchasedFilesResult>(
        `/store/customers/me/house-plans/${planId}/files`
      )
    } catch {
      return null
    }
  }

  async function checkPurchase(planId: string): Promise<boolean> {
    try {
      await sdk.client.fetch(`/store/customers/me/house-plans/${planId}/files`)
      return true
    } catch {
      return false
    }
  }

  async function downloadZip(planId: string, planTitle: string): Promise<void> {
    const token = await sdk.client.getToken()
    const headers: Record<string, string> = { 'x-publishable-api-key': publishableKey }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(
      `${clientBaseUrl}/store/customers/me/house-plans/${planId}/files/zip`,
      { headers }
    )
    if (!res.ok) throw new Error('Błąd pobierania plików')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${planTitle}.zip`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return { getPurchasedFiles, checkPurchase, downloadZip }
}
