<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
async function logout() {
  await clear()
  await navigateTo('/')
}
</script>

<template>
  <div>
    <h1>Index page</h1>
    <div v-if="loggedIn">
      <p>{{ user }}</p>
    </div>
    <button v-if="loggedIn" @click="logout">Logout</button>
    <div v-else>You are not logged in.</div>
    <a href="/api/auth/google">Go to Google Auth</a>
    <NuxtLink to="/login">Go to Login page</NuxtLink>
    <NuxtLink to="/register">Go to Register page</NuxtLink>
  </div>
</template>
