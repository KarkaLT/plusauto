<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { user } = useUserSession()

const hasPassword = ref(false)

// Check if user has a password (not OAuth-only)
onMounted(async () => {
  try {
    const { hasPassword: hasPw } = await $fetch('/api/user/has-password')
    hasPassword.value = hasPw
  } catch (e) {
    console.error('Failed to check password status', e)
  }
})

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileForm = ref({
  phoneNumber: '',
})

onMounted(() => {
  if (user.value?.phoneNumber) {
    profileForm.value.phoneNumber = user.value.phoneNumber
  }
})

const schema = computed(() => {
  const baseSchema = {
    newPassword: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių ilgio'),
    confirmPassword: z.string(),
  }

  if (hasPassword.value) {
    return z
      .object({
        currentPassword: z.string().min(1, 'Dabartinis slaptažodis privalomas'),
        ...baseSchema,
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Slaptažodžiai nesutampa',
        path: ['confirmPassword'],
      })
  }

  return z
    .object({
      currentPassword: z.string().optional(),
      ...baseSchema,
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Slaptažodžiai nesutampa',
      path: ['confirmPassword'],
    })
})

const profileSchema = z.object({
  phoneNumber: z.string().optional(),
})

const toast = useToast()
const isSubmitting = ref(false)
const isProfileSubmitting = ref(false)

async function updateProfile() {
  isProfileSubmitting.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PATCH',
      body: profileForm.value,
    })

    toast.add({
      title: 'Sėkmingai atnaujinta',
      description: 'Profilio informacija sėkmingai atnaujinta',
      color: 'success',
    })
  } catch (error: unknown) {
    console.error('Profile update failed', error)
    const statusMessage =
      (error as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      'Profilio atnaujinimas nepavyko'

    toast.add({
      title: 'Klaida',
      description: statusMessage,
      color: 'error',
    })
  } finally {
    isProfileSubmitting.value = false
  }
}

async function updatePassword() {
  isSubmitting.value = true
  try {
    await $fetch('/api/user/password', {
      method: 'PATCH',
      body: form.value,
    })

    toast.add({
      title: 'Sėkmingai atnaujinta',
      description: 'Jūsų slaptažodis buvo sėkmingai atnaujintas',
      color: 'success',
    })

    // Reset form
    form.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    // Update hasPassword flag
    hasPassword.value = true
  } catch (error: unknown) {
    console.error('Password update failed', error)
    const statusMessage =
      (error as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      'Slaptažodžio atnaujinimas nepavyko'

    toast.add({
      title: 'Klaida',
      description: statusMessage,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
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

    <div class="relative w-full max-w-2xl p-4 z-10">
      <div
        class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
      >
        <div class="p-8 sm:p-10">
          <!-- User Profile Header -->
          <div
            class="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800"
          >
            <UAvatar
              :src="
                user?.picture ??
                `https://api.dicebear.com/10/identicon/svg?seed=${encodeURIComponent(user?.email ?? user?.name ?? 'guest')}`
              "
              :alt="user?.name"
              size="xl"
            />
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user?.name || 'Vartotojas' }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ user?.email }}
              </p>
            </div>
          </div>

          <!-- Profile Section -->
          <div class="mb-10 pb-10 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Profilio informacija
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Atnaujinkite savo kontaktinę informaciją
            </p>

            <UForm
              :schema="profileSchema"
              :state="profileForm"
              class="space-y-6"
              @submit="updateProfile"
            >
              <UFormField label="Telefono numeris" name="phoneNumber">
                <UInput
                  v-model="profileForm.phoneNumber"
                  placeholder="+370 600 00000"
                  icon="i-heroicons-phone"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UButton
                type="submit"
                block
                size="lg"
                color="primary"
                variant="soft"
                :loading="isProfileSubmitting"
                :disabled="isProfileSubmitting"
                class="font-semibold"
              >
                Atnaujinti profilį
              </UButton>
            </UForm>
          </div>

          <!-- Password Section -->
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {{ hasPassword ? 'Keisti slaptažodį' : 'Nustatyti slaptažodį' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {{
                hasPassword
                  ? 'Atnaujinkite savo slaptažodį saugumo tikslais'
                  : 'Nustatykite slaptažodį, kad galėtumėte prisijungti naudodami el. paštą'
              }}
            </p>

            <UForm :schema="schema" :state="form" class="space-y-6" @submit="updatePassword">
              <div class="space-y-4">
                <UFormField
                  v-if="hasPassword"
                  label="Dabartinis slaptažodis"
                  name="currentPassword"
                >
                  <UInput
                    v-model="form.currentPassword"
                    type="password"
                    placeholder="••••••••"
                    icon="i-heroicons-lock-closed"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Naujas slaptažodis" name="newPassword">
                  <UInput
                    v-model="form.newPassword"
                    type="password"
                    placeholder="••••••••"
                    icon="i-heroicons-lock-closed"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Pakartokite naują slaptažodį" name="confirmPassword">
                  <UInput
                    v-model="form.confirmPassword"
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
                :loading="isSubmitting"
                :disabled="isSubmitting"
                class="font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {{ hasPassword ? 'Atnaujinti slaptažodį' : 'Nustatyti slaptažodį' }}
              </UButton>
            </UForm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
