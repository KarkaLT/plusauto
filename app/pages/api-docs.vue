<template>
  <div id="swagger-ui" :class="{ 'swagger-dark': isDark }" />
</template>

<script lang="ts" setup>
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist'
import 'swagger-ui-dist/swagger-ui.css'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

useHead({
  link: computed(() => (isDark.value ? [{ rel: 'stylesheet', href: '/SwaggerDark.css' }] : [])),
})

if (import.meta.client) {
  SwaggerUIBundle({
    url: '/api/spec.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
  })
}
</script>
