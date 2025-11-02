// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  alias: {
    '~': fileURLToPath(new URL('./', import.meta.url)),
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@prisma/nuxt',
    'nuxt-file-storage',
    '@vee-validate/nuxt',
    'nuxt-auth-utils',
  ],
  vite: {
    resolve: {
      alias: {
        '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js',
      },
    },
  },
  fileStorage: {
    mount: process.env.MOUNT,
  },
})
