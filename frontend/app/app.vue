<script setup>
import { useAuthService } from '~/composables/services/useAuthService'
import { useVendorAuthService } from '~/composables/services/useVendorAuthService'

const { getSession } = useAuthService()
const { restoreSession } = useVendorAuthService()

onMounted(() => {
  restoreSession()
  getSession()
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
