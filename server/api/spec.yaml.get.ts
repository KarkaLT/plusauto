export default defineEventHandler(async (event) => {
  const storage = useStorage('assets:server')
  const spec = await storage.getItem('api-spec.yaml')

  if (!spec) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load API specification',
    })
  }

  // Set the appropriate content type for YAML
  event.node.res.setHeader('Content-Type', 'application/x-yaml')
  event.node.res.setHeader('Access-Control-Allow-Origin', '*')

  return spec
})
