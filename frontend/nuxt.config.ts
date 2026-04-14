// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/medusa'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only: used by SSR inside Docker (overridden by NUXT_MEDUSA_BASE_URL)
    medusaBaseUrl: 'http://localhost:9000',
    public: {
      medusa: {
        baseUrl: 'http://localhost:9000', // overridden by NUXT_PUBLIC_MEDUSA_BASE_URL
        publishableKey: '' // overridden by NUXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      }
    }
  },

  // routeRules: {
  //   '/': { prerender: true }
  // },

  compatibilityDate: '2025-01-15',

  vite: {
    optimizeDeps: {
      include: ['qs']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
})