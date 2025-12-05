import { getQuery } from 'h3'
import type { Prisma } from '@prisma/client'
import prisma from '~/lib/prisma'

// Retrieve all comments or comments for a listing
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const listingId = query.listingId as string | undefined

  const where: Prisma.CommentWhereInput = {}

  if (listingId) {
    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })
    if (!listing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Skelbimas nerastas',
      })
    }
    where.listingId = listingId
  }

  return prisma.comment.findMany({
    where: {
      ...where,
      parentId: null, // Only fetch top-level comments
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
})
