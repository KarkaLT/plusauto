import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const listingCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price is required and must be a positive number'),
  categoryId: z.string().min(1, 'Category ID is required'),
  // attributes: object keyed by attribute key -> value
  attributes: z.record(z.string(), z.unknown()).optional(),
})

// Create a new listing
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const user = await requireUserSession(event)

  const body = await readBody(event)

  const result = listingCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: z.treeifyError(result.error),
    })
  }

  // Check if category exists
  if (
    !(await prisma.category.findUnique({
      where: { id: result.data.categoryId },
    }))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category not found',
    })
  }

  // Validate attributes against category's AttributeDefinition
  const defs = await prisma.attributeDefinition.findMany({
    where: { categoryId: result.data.categoryId },
  })
  const defsByKey = Object.fromEntries(defs.map((d) => [d.key, d]))

  const incomingAttrs: Record<string, unknown> = result.data.attributes ?? {}

  // Ensure required attributes are present
  for (const def of defs) {
    if (def.required && (incomingAttrs[def.key] === undefined || incomingAttrs[def.key] === null)) {
      throw createError({ statusCode: 400, statusMessage: `Attribute ${def.key} is required` })
    }
  }

  // Type-check incoming attributes
  for (const [key, value] of Object.entries(incomingAttrs)) {
    const def = defsByKey[key]
    if (!def) {
      throw createError({ statusCode: 400, statusMessage: `Unknown attribute: ${key}` })
    }

    const type = def.type
    const options = def.options as unknown

    switch (type) {
      case 'INT':
        if (typeof value !== 'number' || !Number.isInteger(value))
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} must be an integer`,
          })
        break
      case 'FLOAT':
        if (typeof value !== 'number')
          throw createError({ statusCode: 400, statusMessage: `Attribute ${key} must be a number` })
        break
      case 'BOOLEAN':
        if (typeof value !== 'boolean')
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} must be a boolean`,
          })
        break
      case 'DATE':
        if (isNaN(Date.parse(String(value))))
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} must be a valid date`,
          })
        break
      case 'ENUM':
        try {
          const opts = Array.isArray(options) ? options : JSON.parse(String(options || 'null'))
          if (!Array.isArray(opts) || !opts.includes(value))
            throw createError({
              statusCode: 400,
              statusMessage: `Attribute ${key} must be one of: ${opts?.join(', ')}`,
            })
        } catch {
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} has invalid enum options`,
          })
        }
        break
      case 'STRING':
      case 'JSON':
      default:
        // accept any
        break
    }

    // Additional validation for min/max and date limits
    // For numeric types (INT and FLOAT), enforce minNumber/maxNumber
    if ((type === 'INT' || type === 'FLOAT') && value !== null && value !== undefined) {
      const meta = def as unknown as { minNumber?: number | null; maxNumber?: number | null }
      const minN = meta.minNumber as number | null | undefined
      const maxN = meta.maxNumber as number | null | undefined
      if (minN !== null && minN !== undefined && typeof value === 'number' && value < minN) {
        throw createError({ statusCode: 400, statusMessage: `Attribute ${key} must be >= ${minN}` })
      }
      if (maxN !== null && maxN !== undefined && typeof value === 'number' && value > maxN) {
        throw createError({ statusCode: 400, statusMessage: `Attribute ${key} must be <= ${maxN}` })
      }
    }

    // For date type, enforce minDate/maxDate
    if (type === 'DATE' && value !== null && value !== undefined) {
      const metaD = def as unknown as { minDate?: string | null; maxDate?: string | null }
      const minD = metaD.minDate as Date | string | null | undefined
      const maxD = metaD.maxDate as Date | string | null | undefined
      const parsedVal = new Date(String(value))
      if (minD) {
        const minDate = new Date(minD)
        if (!isNaN(minDate.getTime()) && parsedVal.getTime() < minDate.getTime()) {
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} must be on or after ${minDate.toISOString()}`,
          })
        }
      }
      if (maxD) {
        const maxDate = new Date(maxD)
        if (!isNaN(maxDate.getTime()) && parsedVal.getTime() > maxDate.getTime()) {
          throw createError({
            statusCode: 400,
            statusMessage: `Attribute ${key} must be on or before ${maxDate.toISOString()}`,
          })
        }
      }
    }
  }

  // Create listing and attributes in a transaction
  const created = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.create({
      data: {
        title: result.data.title,
        authorId: user.id,
        description: result.data.description,
        price: result.data.price,
        categoryId: result.data.categoryId,
      },
    })

    const attrRows = Object.entries(incomingAttrs).map(([key, value]) => ({
      listingId: listing.id,
      attributeId: defsByKey[key].id,
      value: value as Prisma.InputJsonValue,
    }))

    if (attrRows.length)
      await tx.listingAttribute.createMany({ data: attrRows, skipDuplicates: true })

    return listing
  })

  return created
})
