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
  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'dompl-color-mode'
  },

  icon: {
    customCollections: [
      { prefix: 'local', dir: './app/assets/icons' }
    ]
  },
  fonts: {
    families: [
      {
        name: 'Inter',
        provider: 'google',
      },
    ],
  },

  runtimeConfig: {
    medusaBaseUrl: 'http://localhost:9000',
    newsletterWebhookUrl: '',
    // public file URLs use localhost:9090, but containers must use minio:9000
    fileStoragePublicBase: '', // e.g. http://localhost:9090/medusa-bucket
    fileStorageInternalBase: '', // e.g. http://minio:9000/medusa-bucket
    public: {
      medusa: {
        baseUrl: 'http://localhost:9000',
        publishableKey: ''
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
    },
    server: {
      hmr: {
        host: 'localhost',
        port: 24678
      },
      watch: {
        usePolling: true,
        interval: 500
      }
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