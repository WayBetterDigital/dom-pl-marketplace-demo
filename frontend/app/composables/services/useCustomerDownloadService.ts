import { useMedusaClient } from '#imports'
import type { HousePlanFile } from './useFileService'

export interface PurchasedFilesResult {
  files: HousePlanFile[]
  plan_title: string
}

export function useCustomerDownloadService() {
  const sdk = useMedusaClient()

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
    // Override accept so the SDK returns the raw Response instead of parsing as JSON
    const response = await sdk.client.fetch<globalThis.Response>(
      `/store/customers/me/house-plans/${planId}/files/zip`,
      { headers: { accept: 'application/octet-stream' } }
    )

    const blob = await (response as unknown as globalThis.Response).blob()
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
