import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'
import { del } from '@vercel/blob'

const listingDeleteSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Delete a listing by ID
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, listingDeleteSchema.parse)

  // Check if listing exists
  const listing = await prisma.listing.findUnique({ where: { id } })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Skelbimas nerastas',
    })
  }

  // Only allow deletion if the user is the owner OR an ADMIN
  if (listing.authorId !== extendedUser.id && extendedUser.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Galite ištrinti tik savo skelbimą',
    })
  }

  // Load related images to remove files from storage
  const images = await prisma.images.findMany({ where: { listingId: id } })

  // If images are local (DEV) delete them from local disk; if production and using Vercel Blob, delete via API
  for (const image of images) {
    try {
      // Local storage path format: /images/listings/<filename>
      if (process.env.NODE_ENV === 'production') {
        // Attempt to delete remote blob. deleteRemoteBlob accepts url or pathname
        await del(image.url)
      } else {
        // Extract filename from URL
        const parts = image.url.split('/')
        const filename = parts.pop() || ''
        // Use built-in deleteFile from nuxt-file-storage
        await deleteFile(filename, '/listings')
      }
    } catch (err) {
      // Log and continue — don't block deletion due to storage deletion errors
      console.warn('Failed to delete image file for listing', id, { err })
    }
  }

  // Delete DB records and the listing itself in a single transaction for atomicity
  const results = await prisma.$transaction([
    prisma.comment.deleteMany({ where: { listingId: id } }),
    prisma.images.deleteMany({ where: { listingId: id } }),
    prisma.listing.delete({ where: { id } }),
  ])

  // Return the deleted listing object from the transaction results
  return results[2]
})
