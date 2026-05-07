/**
 * Rewrites a public MinIO/S3 URL to the internal Docker URL for server-side fetches.
 * Public URLs use localhost (browser-accessible), but backend containers must reach
 * MinIO via its internal hostname.
 *
 * Reads S3_FILE_URL (public base) and S3_ENDPOINT + S3_BUCKET (internal base) from env.
 */
export function resolveInternalFileUrl(publicUrl: string): string {
  const publicBase = process.env.S3_FILE_URL?.replace(/\/$/, '')
  const internalBase = process.env.S3_ENDPOINT && process.env.S3_BUCKET
    ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${process.env.S3_BUCKET}`
    : undefined
  if (publicBase && internalBase && publicUrl.startsWith(publicBase)) {
    return publicUrl.replace(publicBase, internalBase)
  }
  return publicUrl
}
