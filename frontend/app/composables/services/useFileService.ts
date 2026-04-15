import { useMedusaClient } from '#imports'

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

  async function getFiles(planId: string): Promise<HousePlanFile[]> {
    const response = await sdk.client.fetch<{ files: HousePlanFile[] }>(
      `/store/house-plans/${planId}/files`
    )
    return response.files || []
  }

  async function uploadFile(planId: string, file: File): Promise<HousePlanFile> {
    const content = await readFileAsBase64(file)
    const response = await sdk.client.fetch<{ file: HousePlanFile }>(
      `/store/house-plans/${planId}/files`,
      {
        method: 'POST',
        body: {
          filename: file.name,
          mimeType: file.type,
          content,
          size: file.size
        }
      }
    )
    return response.file
  }

  async function deleteFile(planId: string, fileId: string): Promise<void> {
    await sdk.client.fetch(
      `/store/house-plans/${planId}/files/${fileId}`,
      { method: 'DELETE' }
    )
  }

  return { getFiles, uploadFile, deleteFile }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
