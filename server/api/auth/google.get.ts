export default defineOAuthGoogleEventHandler({
  // Optional, will redirect to '/' by default
  async onSuccess(event, { user, tokens }) {
    console.log('Google OAuth success:', { user, tokens })

    await setUserSession(event, {
      user,
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
