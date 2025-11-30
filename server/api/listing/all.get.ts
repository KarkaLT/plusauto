import { getQuery } from 'h3'
import prisma from '~/lib/prisma'
import type { Prisma } from '@prisma/client'

// Retrieve all listings
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoryId = query.categoryId as string | undefined

  // Build the where clause
  const where: Prisma.ListingWhereInput = {}

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kategorija nerasta',
      })
    }
    where.categoryId = categoryId
  }

  // Process attribute filters
  const attributeFilters: Prisma.ListingWhereInput[] = []

  // Exclude known non-attribute query parameters
  const reservedParams = ['categoryId', 'page', 'limit', 'sort']

  for (const [key, value] of Object.entries(query)) {
    if (reservedParams.includes(key) || !value) continue

    // Handle range filters (min/max, from/to)
    if (key.endsWith('_min') || key.endsWith('_from')) {
      const attrKey = key.replace(/(_min|_from)$/, '')
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        attributeFilters.push({
          attributes: {
            some: {
              attribute: { key: attrKey },
              value: { gte: numValue },
            },
          },
        })
      }
    } else if (key.endsWith('_max') || key.endsWith('_to')) {
      const attrKey = key.replace(/(_max|_to)$/, '')
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        attributeFilters.push({
          attributes: {
            some: {
              attribute: { key: attrKey },
              value: { lte: numValue },
            },
          },
        })
      }
    } else {
      // Exact match (string, boolean, enum)
      // Handle array values for multi-select (OR logic for same attribute)
      if (Array.isArray(value)) {
        attributeFilters.push({
          attributes: {
            some: {
              attribute: { key },
              OR: (value as string[]).map((v) => ({ value: { equals: v } })),
            },
          },
        })
      } else {
        // Try to parse boolean
        let parsedValue: string | boolean | number = value as string
        if (value === 'true') parsedValue = true
        if (value === 'false') parsedValue = false

        attributeFilters.push({
          attributes: {
            some: {
              attribute: { key },
              value: { equals: parsedValue },
            },
          },
        })
      }
    }
  }

  if (attributeFilters.length > 0) {
    where.AND = attributeFilters
  }

  // Handle sorting
  const sort = query.sort as string | undefined
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' }

  if (sort === 'createdAt_asc') {
    orderBy = { createdAt: 'asc' }
  } else if (sort === 'price_asc') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price_desc') {
    orderBy = { price: 'desc' }
  }

  const listings = await prisma.listing.findMany({
    where,
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
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy,
  })

  // Transform listings to include flattened common attributes
  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    image: listing.images[0]?.url || null,
    categoryId: listing.categoryId,
    category: listing.category,
    author: listing.author,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }))
})
