export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { statusMessage: 'Logged out' }
})
