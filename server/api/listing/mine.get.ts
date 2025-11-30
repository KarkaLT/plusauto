import prisma from '~/lib/prisma'
import type { User } from '~/server/types/User'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const listings = await prisma.listing.findMany({
    where: {
      authorId: extendedUser.id,
    },
    include: {
      images: {
        take: 1,
        orderBy: { id: 'asc' },
      },
      attributes: {
        include: {
          attribute: true,
        },
      },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    image: listing.images[0]?.url || null,
    categoryId: listing.categoryId,
    category: listing.category,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }))
})
