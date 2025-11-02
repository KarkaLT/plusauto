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
      <p>Welcome, {{ user?.name || user?.email }}!</p>
      <p>ID: {{ user?.id }}</p>
      <p>Role: {{ user?.role }}</p>
      <p>Email: {{ user?.email }}</p>
      <button @click="logout">Logout</button>
    </div>
    <div v-else>You are not logged in.</div>
    <NuxtLink to="/login">Go to Login page</NuxtLink>
    <NuxtLink to="/register">Go to Register page</NuxtLink>
  </div>
</template>
