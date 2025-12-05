<template>
  <div id="swagger-ui" class="bg-white"/>
</template>

<script lang="ts" setup>
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist'
import 'swagger-ui-dist/swagger-ui.css'

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
