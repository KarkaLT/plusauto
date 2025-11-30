import { join } from 'path'
import { readFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  // Only serve in development, or if you want to serve local files in production too (not recommended if using Vercel Blob)
  // But since we use Vercel Blob in production, this route might not be hit for new uploads,
  // but existing local files (if any) or if we want to unify.
  // However, the upload endpoint returns /images/... only in dev.

  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  // Get MOUNT from env
  const mount = process.env.MOUNT
  if (!mount) {
    throw createError({ statusCode: 500, statusMessage: 'MOUNT not configured' })
  }

  const filePath = join(mount, path)

  try {
    const file = await readFile(filePath)
    // Determine mime type based on extension?
    // For now, let's just return the file. Nitro/H3 might handle headers or we can set them.
    // A simple way is to use sendStream if we had a stream, or just return the buffer.
    // Ideally set Content-Type.

    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    }

    if (ext && mimeTypes[ext]) {
      setHeader(event, 'Content-Type', mimeTypes[ext])
    }

    return file
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})
