import { put } from '@vercel/blob'
import type { ServerFile } from 'nuxt-file-storage'
import sharp from 'sharp'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { files } = await readBody<{ files: ServerFile[] }>(event)
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No files uploaded',
    })
  }

  const urls: string[] = []

  for (const file of files) {
    // Convert Data URL to Buffer
    const base64Data = file.content.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Convert to WebP using sharp
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer()

    const webpFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'

    if (process.env.NODE_ENV === 'production') {
      const { url } = await put(webpFileName, webpBuffer, { access: 'public' })
      urls.push(url)
    } else {
      // Development: use nuxt-file-storage
      // We need to construct a new ServerFile object with the WebP content
      const webpContent = `data:image/webp;base64,${webpBuffer.toString('base64')}`

      const webpFile: ServerFile = {
        name: webpFileName,
        content: webpContent,
        type: 'image/webp',
        size: String(webpBuffer.length),
        lastModified: file.lastModified,
      }

      const fileName = await storeFileLocally(
        webpFile,
        10,
        'listings' // Folder name inside MOUNT
      )
      // nuxt-file-storage stores in MOUNT/listings/fileName
      // We need to return a URL that the frontend can use to access this file.
      // Assuming there is a way to serve these files.
      // If MOUNT is /Users/karolis/plusauto/images, and we store in 'listings',
      // the file is at /Users/karolis/plusauto/images/listings/fileName.
      // We need a route to serve this.
      // For now, let's assume we can map /images/ to the MOUNT point.
      urls.push(`/images/listings/${fileName}`)
    }
  }

  return {
    urls,
  }
})
