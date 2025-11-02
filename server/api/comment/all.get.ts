import { getQuery } from 'h3'
import prisma from '~/lib/prisma'

// Retrieve all comments for a listing
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const listingId = query.listingId as string | undefined

  if (!listingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'listingId is required',
    })
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  })
  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing not found',
    })
  }

  return prisma.comment.findMany({
    where: {
      listingId,
      parentId: null, // Only fetch top-level comments
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
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
