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
})
async function login() {
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    // Refresh the session on client-side and redirect to the home page
    await refreshSession()
    await navigateTo('/')
  } catch {
    alert('Bad credentials')
  }
}
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="credentials.email" type="email" placeholder="Email" >
    <input v-model="credentials.password" type="password" placeholder="Password" >
    <button type="submit">Login</button>
  </form>
</template>
