export default defineEventHandler(async (e) => {
  const { email } = await readBody(e)
  const value = String(email || '').trim()
  const isValid =
    !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
  const config = useRuntimeConfig()
  const url = config.newsletterWebhookUrl
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook not configured',
    })
  }
  await $fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { email: value },
  })
  return { ok: true }
})
