import prisma from '~/lib/prisma'

export default defineOAuthGoogleEventHandler({
  // Optional, will redirect to '/' by default
  async onSuccess(event, { user, tokens }) {
    console.log('Google OAuth success:', { user, tokens })

    // Try to find user by googleId first (for returning OAuth users)
    let dbUser = await prisma.user.findUnique({
      where: { googleId: user.sub },
    })

    // If not found by googleId, try by email (for users who registered via email/password)
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      })
    }

    // If user exists, update their googleId and picture
    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          googleId: user.sub,
          picture: user.picture,
          name: user.name, // Update name in case it changed
        },
      })
    } else {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          googleId: user.sub,
          name: user.name,
          picture: user.picture,
          role: 'USER',
        },
      })
    }

    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name ?? '',
        picture: dbUser.picture ?? undefined,
        googleId: dbUser.googleId ?? undefined,
        role: dbUser.role,
      },
      tokens,
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
