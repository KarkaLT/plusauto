import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'
import type { Prisma } from '@prisma/client'

const listingIdSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

const listingUpdateSchema = z.object({
  title: z.string().min(1, 'Pavadinimas yra privalomas').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Kaina yra privaloma ir turi būti teigiamas skaičius').optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string()).optional(),
})

// Update a listing
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, listingIdSchema.parse)
  const body = await readBody(event)

  const result = listingUpdateSchema.safeParse(body)

  // Validate input
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: id },
    include: { category: true },
  })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Skelbimas nerastas',
    })
  }

  // Check if user owns the listing or is admin
  if (listing.authorId !== extendedUser.id && extendedUser.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Galite redaguoti tik savo skelbimą',
    })
  }

  // If attributes are being updated, validate them
  let validatedAttributes: Record<string, unknown> | undefined
  if (result.data.attributes !== undefined) {
    // Get attribute definitions for this category
    const defs = await prisma.attributeDefinition.findMany({
      where: { categoryId: listing.categoryId },
    })
    const defsByKey = Object.fromEntries(defs.map((d) => [d.key, d]))

    const incomingAttrs: Record<string, unknown> = result.data.attributes ?? {}

    // Ensure required attributes are present
    for (const def of defs) {
      if (
        def.required &&
        (incomingAttrs[def.key] === undefined || incomingAttrs[def.key] === null)
      ) {
        throw createError({ statusCode: 400, statusMessage: `Atributas ${def.key} yra privalomas` })
      }
    }

    // Type-check incoming attributes
    for (const [key, value] of Object.entries(incomingAttrs)) {
      const def = defsByKey[key]
      if (!def) {
        throw createError({ statusCode: 400, statusMessage: `Nežinomas atributas: ${key}` })
      }

      const type = def.type
      const options = def.options as unknown

      switch (type) {
        case 'INT':
          if (typeof value !== 'number' || !Number.isInteger(value))
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi būti sveikasis skaičius`,
            })
          break
        case 'FLOAT':
          if (typeof value !== 'number')
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi būti skaičius`,
            })
          break
        case 'BOOLEAN':
          if (typeof value !== 'boolean')
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi būti loginė reikšmė (true/false)`,
            })
          break
        case 'DATE':
          if (isNaN(Date.parse(String(value))))
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi būti galiojanti data`,
            })
          break
        case 'ENUM':
          try {
            const opts = Array.isArray(options) ? options : JSON.parse(String(options || 'null'))
            if (!Array.isArray(opts) || !opts.includes(value))
              throw createError({
                statusCode: 400,
                statusMessage: `Atributas ${key} turi būti vienas iš: ${opts?.join(', ')}`,
              })
          } catch {
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi netinkamas enum reikšmes`,
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
      if ((type === 'INT' || type === 'FLOAT') && value !== null && value !== undefined) {
        const meta = def as unknown as { minNumber?: number | null; maxNumber?: number | null }
        const minN = meta.minNumber as number | null | undefined
        const maxN = meta.maxNumber as number | null | undefined
        if (minN !== null && minN !== undefined && typeof value === 'number' && value < minN) {
          throw createError({
            statusCode: 400,
            statusMessage: `Atributas ${key} turi būti ne mažesnis nei ${minN}`,
          })
        }
        if (maxN !== null && maxN !== undefined && typeof value === 'number' && value > maxN) {
          throw createError({
            statusCode: 400,
            statusMessage: `Atributas ${key} turi būti ne didesnis nei ${maxN}`,
          })
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
              statusMessage: `Atributas ${key} turi būti ne anksčiau nei ${minDate.toISOString()}`,
            })
          }
        }
        if (maxD) {
          const maxDate = new Date(maxD)
          if (!isNaN(maxDate.getTime()) && parsedVal.getTime() > maxDate.getTime()) {
            throw createError({
              statusCode: 400,
              statusMessage: `Atributas ${key} turi būti ne vėliau nei ${maxDate.toISOString()}`,
            })
          }
        }
      }
    }

    validatedAttributes = incomingAttrs
  }

  // Perform updates in a transaction
  return await prisma.$transaction(async (tx) => {
    // Update basic listing fields
    const dataToUpdate: { title?: string; description?: string; price?: number } = {}
    if (result.data.title) {
      dataToUpdate.title = result.data.title
    }
    if (result.data.description !== undefined) {
      dataToUpdate.description = result.data.description
    }
    if (result.data.price !== undefined) {
      dataToUpdate.price = result.data.price
    }

    const updatedListing = await tx.listing.update({
      where: { id: id },
      data: dataToUpdate,
    })

    // Update attributes if provided
    if (validatedAttributes !== undefined) {
      // Delete existing attributes
      await tx.listingAttribute.deleteMany({
        where: { listingId: id },
      })

      // Get attribute definitions again to ensure we have the IDs
      const defs = await tx.attributeDefinition.findMany({
        where: { categoryId: listing.categoryId },
      })
      const defsByKey = Object.fromEntries(defs.map((d) => [d.key, d]))

      // Create new attribute records
      const attrRows = Object.entries(validatedAttributes).map(([key, value]) => ({
        listingId: id,
        attributeId: defsByKey[key].id,
        value: value as Prisma.InputJsonValue,
      }))

      if (attrRows.length > 0) {
        await tx.listingAttribute.createMany({ data: attrRows, skipDuplicates: true })
      }
    }

    // Update images if provided
    if (result.data.images !== undefined) {
      // Delete existing images
      await tx.images.deleteMany({
        where: { listingId: id },
      })

      // Create new images
      if (result.data.images.length > 0) {
        await tx.images.createMany({
          data: result.data.images.map((url) => ({
            url,
            listingId: id,
          })),
        })
      }
    }

    return updatedListing
  })
})
