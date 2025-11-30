<script setup lang="ts">
import { z } from 'zod'
definePageMeta({
  layout: 'default',
})

const form = ref({
  email: '',
  password: '',
})

const schema = z.object({
  email: z.email('Neteisingas el. pašto formatas'),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių ilgio'),
})

const { fetch: fetchSession } = useUserSession()

async function login() {
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form.value,
    })
    await fetchSession()
    await navigateTo('/')
  } catch (error: unknown) {
    console.error('Login failed', error)
    const statusMessage =
      (error as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      'Prisijungimas nepavyko'
    alert(statusMessage)
  }
}

function handleGoogleLogin() {
  window.location.href = '/api/auth/google'
}
</script>

<template>
  <div
    class="flex items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden bg-gray-50 dark:bg-gray-950"
  >
    <!-- Decorative background elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/10 blur-[100px]"
      />
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]"
      />
    </div>

    <div class="relative w-full max-w-md p-4 z-10">
      <div
        class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
      >
        <div class="p-8 sm:p-10">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Sveiki sugrįžę
            </h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Prisijunkite prie savo paskyros
            </p>
          </div>

          <UForm :schema="schema" :state="form" class="space-y-6" @submit="login">
            <div class="space-y-4">
              <UFormField label="El. paštas" name="email">
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="vardas@pavyzdys.lt"
                  icon="i-heroicons-envelope"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Slaptažodis" name="password">
                <UInput
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-heroicons-lock-closed"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UButton
              type="submit"
              block
              size="lg"
              color="primary"
              class="font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Prisijungti
            </UButton>
          </UForm>

          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                  >Arba tęskite su</span
                >
              </div>
            </div>

            <div class="mt-6">
              <UButton
                block
                color="neutral"
                variant="ghost"
                class="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="handleGoogleLogin"
              >
                <UIcon name="i-simple-icons-google" class="w-5 h-5 text-gray-900 dark:text-white" />
                <span class="ml-2 text-gray-700 dark:text-gray-200">Google</span>
              </UButton>
            </div>
          </div>
        </div>

        <div
          class="px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50 text-center"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Neturite paskyros?
            <NuxtLink
              to="/register"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Registruotis
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
