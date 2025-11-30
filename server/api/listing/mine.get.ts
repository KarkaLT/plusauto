import prisma from '~/lib/prisma'
import type { User } from '~/server/types/User'

// Helper function to extract attribute values
function extractAttributeValue(
  attributes: { attribute?: { key: string }; value?: unknown }[],
  key: string
): unknown {
  const attr = attributes.find((a) => a.attribute?.key === key)
  return attr?.value ?? null
}

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

  // Transform listings to include flattened common attributes
  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    image: listing.images[0]?.url || null,
    categoryId: listing.categoryId,
    category: listing.category,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    // Extract common attributes
    year: extractAttributeValue(listing.attributes, 'year'),
    fuelType: extractAttributeValue(listing.attributes, 'fuel_type'),
    gearbox: extractAttributeValue(listing.attributes, 'gearbox'),
    power: extractAttributeValue(listing.attributes, 'power'),
    mileage: extractAttributeValue(listing.attributes, 'mileage'),
    city: extractAttributeValue(listing.attributes, 'city'),
  }))
})
