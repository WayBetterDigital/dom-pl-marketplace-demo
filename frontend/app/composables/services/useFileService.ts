import { useMedusaClient, useRuntimeConfig } from '#imports'

export interface HousePlanFile {
  id: string
  house_plan_id: string
  url: string
  name: string
  mime_type: string
  size: number
  sort_order: number
  created_at: string
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'i-lucide-file-text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'i-lucide-file-spreadsheet'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'i-lucide-file-archive'
  if (mimeType.startsWith('image/')) return 'i-lucide-file-image'
  if (mimeType.startsWith('video/')) return 'i-lucide-file-video'
  return 'i-lucide-file'
}

export function fileIconColor(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'text-red-500'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-600'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'text-yellow-500'
  if (mimeType.startsWith('image/')) return 'text-blue-500'
  return 'text-muted'
}

export function useFileService() {
  const sdk = useMedusaClient()
  const config = useRuntimeConfig()
  const baseUrl = (config.public.medusa as any).baseUrl as string
  const publishableKey = (config.public.medusa as any).publishableKey as string

  async function downloadZip(planId: string, planTitle: string): Promise<void> {
    const response = await sdk.client.fetch<globalThis.Response>(
      `/store/house-plans/${planId}/files/zip`,
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

  async function getFiles(planId: string): Promise<HousePlanFile[]> {
    const response = await sdk.client.fetch<{ files: HousePlanFile[] }>(
      `/store/house-plans/${planId}/files`
    )
    return response.files || []
  }

  async function uploadFile(planId: string, file: File): Promise<HousePlanFile> {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${baseUrl}/store/house-plans/${planId}/files`, {
      method: 'POST',
      headers: { 'x-publishable-api-key': publishableKey },
      body: form
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message || `Błąd ${res.status}`)
    }

    const data = await res.json()
    return data.file
  }

  async function deleteFile(planId: string, fileId: string): Promise<void> {
    await sdk.client.fetch(
      `/store/house-plans/${planId}/files/${fileId}`,
      { method: 'DELETE' }
    )
  }

  return { getFiles, uploadFile, deleteFile, downloadZip }
}
