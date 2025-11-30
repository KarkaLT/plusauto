import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const commentCreateSchema = z.object({
  listingId: z.string().min(1, 'Skelbimo ID yra privalomas'),
  content: z.string().min(1, 'Turinys yra privalomas'),
  parentId: z.string().optional(),
})

// Create a new comment
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const body = await readBody(event)

  const result = commentCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if listing exists
  if (!(await prisma.listing.findUnique({ where: { id: result.data.listingId } }))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Skelbimas nerastas',
    })
  }

  // If it's a reply, check if parent comment exists
  if (
    result.data.parentId &&
    !(await prisma.comment.findUnique({ where: { id: result.data.parentId } }))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tėvinis komentaras nerastas',
    })
  }

  return prisma.comment.create({
    data: {
      listingId: result.data.listingId,
      authorId: extendedUser.id,
      content: result.data.content,
      parentId: result.data.parentId,
    },
  })
})
