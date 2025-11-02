import prisma from '~/lib/prisma'
import { z } from 'zod'

const commentCreateSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  content: z.string().min(1, 'Content is required'),
  parentId: z.string().optional(),
})

// Create a new comment
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const user = await requireUserSession(event)

  const body = await readBody(event)

  const result = commentCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: z.treeifyError(result.error),
    })
  }

  // Check if listing exists
  if (!(await prisma.listing.findUnique({ where: { id: result.data.listingId } }))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Listing not found',
    })
  }

  // If it's a reply, check if parent comment exists
  if (
    result.data.parentId &&
    !(await prisma.comment.findUnique({ where: { id: result.data.parentId } }))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parent comment not found',
    })
  }

  return prisma.comment.create({
    data: {
      listingId: result.data.listingId,
      authorId: user.id,
      content: result.data.content,
      parentId: result.data.parentId,
    },
  })
})
