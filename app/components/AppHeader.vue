<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

async function logout() {
  console.log('logout')
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/')
}

const items = [
  [
    {
      label: 'Mano skelbimai',
      icon: 'i-heroicons-list-bullet',
      to: '/my-listings',
    },
  ],
  [
    {
      label: 'Atsijungti',
      icon: 'i-heroicons-arrow-left-on-rectangle',
      onSelect: logout,
    },
  ],
]
</script>

<template>
  <header
    class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50"
  >
    <UContainer class="flex items-center justify-between h-16">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">PlusAuto</span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-4">
        <UButton
          to="/listings/create"
          icon="i-heroicons-plus"
          color="primary"
          variant="solid"
          label="Įdėti skelbimą"
        />

        <div v-if="loggedIn" class="flex items-center gap-3">
          <UDropdownMenu :items="items" :popper="{ placement: 'bottom-end' }">
            <UButton color="neutral" variant="ghost" trailing-icon="i-heroicons-chevron-down">
              <UAvatar
                :src="`https://api.dicebear.com/10/identicon/svg?seed=${encodeURIComponent(user?.email ?? user?.name ?? 'guest')}`"
                :alt="user?.name"
                size="xs"
              />
              <span class="hidden sm:inline text-sm font-medium">{{ user?.name }}</span>
            </UButton>
          </UDropdownMenu>
        </div>
        <div v-else class="flex items-center gap-2">
          <UButton to="/login" color="neutral" variant="ghost" label="Prisijungti" />
        </div>
      </div>
    </UContainer>
  </header>
</template>
