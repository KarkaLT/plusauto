<script setup lang="ts">
const { loggedIn, fetch: refreshSession } = useUserSession()

// Only redirect if already logged in
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/')
  }
})

const credentials = reactive({
  email: '',
  password: '',
  name: '',
})

async function register() {
  try {
    await $fetch('/api/register', {
      method: 'POST',
      body: credentials,
    })

    // Refresh the session on client-side and redirect to the home page
    await refreshSession()
    await navigateTo('/')
  } catch {
    alert('Registration failed')
  }
}
</script>

<template>
  <form @submit.prevent="register">
    <input v-model="credentials.name" type="text" placeholder="Name (optional)" maxlength="100" >
    <input v-model="credentials.email" type="email" required placeholder="Email" >
    <input
      v-model="credentials.password"
      required
      type="password"
      placeholder="Password (min 8 characters)"
    >
    <button type="submit">Register</button>
  </form>
</template>
