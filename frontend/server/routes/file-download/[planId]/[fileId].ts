import { defineEventHandler, getRouterParam, setResponseHeader, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const planId = getRouterParam(event, 'planId')
  const fileId = getRouterParam(event, 'fileId')

  if (!planId || !fileId) {
    throw createError({ statusCode: 400, statusMessage: 'Brakujące parametry' })
  }

  const config = useRuntimeConfig()
  const backendUrl = (config.medusaBaseUrl as string).replace(/\/$/, '')
  const publishableKey = config.public.medusa.publishableKey as string

  // 1. Fetch file metadata from Medusa
  const metaRes = await fetch(
    `${backendUrl}/store/house-plans/${planId}/files`,
    { headers: { 'x-publishable-api-key': publishableKey } }
  ).catch(() => null)

  if (!metaRes || !metaRes.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Nie udało się pobrać metadanych pliku' })
  }

  const { files } = await metaRes.json() as { files: Array<{ id: string; url: string; name: string; mime_type: string; size: number }> }
  const file = files.find(f => f.id === fileId)

  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Plik nie znaleziony' })
  }

  // 2. Rewrite public URL to internal Docker URL if configured
  //    (e.g. http://localhost:9090/medusa-bucket → http://minio:9000/medusa-bucket)
  const publicBase = config.fileStoragePublicBase as string
  const internalBase = config.fileStorageInternalBase as string
  const fileUrl = (publicBase && internalBase && file.url.startsWith(publicBase))
    ? file.url.replace(publicBase, internalBase)
    : file.url

  // 3. Fetch the actual file content
  const upstream = await fetch(fileUrl).catch(() => null)

  if (!upstream || !upstream.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Nie udało się pobrać pliku ze źródła' })
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())

  setResponseHeader(event, 'Content-Type', file.mime_type || 'application/octet-stream')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`)
  setResponseHeader(event, 'Content-Length', String(buffer.length))

  return buffer
})
