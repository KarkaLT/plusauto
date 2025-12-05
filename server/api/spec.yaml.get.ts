import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    // Read the api-spec.yaml file from the project root
    const specPath = join(process.cwd(), 'api-spec.yaml')
    const specContent = await readFile(specPath, 'utf-8')

    // Set the appropriate content type for YAML
    event.node.res.setHeader('Content-Type', 'application/x-yaml')
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')

    return specContent
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load API specification',
    })
  }
})
