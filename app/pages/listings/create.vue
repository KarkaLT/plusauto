<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({ layout: 'default' })

// --- Types ---
type AttributeType = 'STRING' | 'INT' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'ENUM' | 'JSON'

interface AttributeDefinition {
  id: string
  categoryId: string
  name: string
  key: string
  type: AttributeType
  required: boolean
  options?: unknown | null
  minNumber?: number | null
  maxNumber?: number | null
  minDate?: string | null
  maxDate?: string | null
  // Added for UI helper
  parsedOptions?: string[]
}

interface Category {
  id: string
  name: string
  description?: string | null
}

interface CategoryWithAttributes extends Category {
  attributes: AttributeDefinition[]
}

interface CategorySelectItem {
  id: string
  name: string
  description: string
  label: string
}

// --- State ---
const loading = ref(false)
const selectedCategory = ref<CategorySelectItem | undefined>(undefined)
const categoryAttributes = ref<AttributeDefinition[]>([])
const attributeErrors = ref<Record<string, string | null>>({})
const touchedFields = ref<Record<string, boolean>>({})
const files = ref<File[]>([])

const form = ref({
  title: '',
  description: '',
  price: null as number | null,
  categoryId: null as string | null,
  attributes: {} as Record<string, unknown>,
  images: [] as string[],
})

// --- Data Fetching ---
const { data: categories } = await useFetch<Category[]>('/api/category/all', {
  default: () => [],
})

// --- Computed ---
const categoryOptions = computed(() =>
  (categories.value || []).map((c) => ({
    id: c.id,
    name: c.name,
    label: c.name,
    description: c.description ?? undefined,
  }))
)

const hasAttributeErrors = computed(() =>
  Object.values(attributeErrors.value).some((error) => !!error)
)

const shouldShowError = (key: string) => {
  return touchedFields.value[key] && attributeErrors.value[key]
}

// --- Methods ---

async function loadCategoryDetails(id: string) {
  try {
    const data = await $fetch<CategoryWithAttributes>(`/api/category/${id}`)

    // Pre-process attributes (parse ENUM options once)
    categoryAttributes.value = (data?.attributes || []).map((attr) => {
      if (attr.type === 'ENUM') {
        const rawOpts = attr.options
        let parsed: string[] = []
        try {
          parsed = Array.isArray(rawOpts) ? rawOpts : JSON.parse(String(rawOpts || '[]'))
        } catch {
          /* ignore error */
        }
        return { ...attr, parsedOptions: parsed }
      }
      return attr
    })

    // Reset form attributes
    form.value.attributes = {}
    categoryAttributes.value.forEach((def) => {
      form.value.attributes[def.key] = null
    })

    // Clear errors and touched state
    attributeErrors.value = {}
    touchedFields.value = {}
  } catch (err) {
    console.error('Error loading details:', err)
  }
}

function runValidation() {
  let isValid = true
  const newErrors: Record<string, string | null> = {}

  for (const def of categoryAttributes.value) {
    const rawValue = form.value.attributes[def.key]
    const error = getAttributeError(def, rawValue)
    newErrors[def.key] = error
    if (error) isValid = false
  }

  attributeErrors.value = newErrors
  return isValid
}

function validateField(key: string) {
  const def = categoryAttributes.value.find((d) => d.key === key)
  if (!def) return

  const rawValue = form.value.attributes[key]
  const error = getAttributeError(def, rawValue)
  attributeErrors.value[key] = error
}

function handleFieldBlur(key: string) {
  touchedFields.value[key] = true
  validateField(key)
}

async function handleFileChange() {
  if (!files.value.length) return

  const filesToUpload = []
  for (const file of files.value) {
    const reader = new FileReader()
    const p = new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
    })
    reader.readAsDataURL(file)
    const content = await p
    filesToUpload.push({
      name: file.name,
      content: content,
      type: file.type,
      size: String(file.size),
      lastModified: String(file.lastModified),
    })
  }

  try {
    const { urls } = await $fetch<{ urls: string[] }>('/api/upload', {
      method: 'POST',
      body: { files: filesToUpload },
    })
    form.value.images.push(...urls)
  } catch (err) {
    console.error('Upload failed:', err)
    // TODO: Show error notification
  } finally {
    files.value = [] // Reset input
  }
}

const { user } = useUserSession()

async function submit() {
  console.log(user.value)

  if (loading.value) return
  loading.value = true

  try {
    if (!runValidation()) return

    // Prepare payload with parsed values
    const cleanAttributes: Record<string, unknown> = {}
    for (const def of categoryAttributes.value) {
      const raw = form.value.attributes[def.key]
      const parsed = parseValueForSubmit(def, raw)
      if (parsed !== null) cleanAttributes[def.key] = parsed
    }

    const payload = {
      title: form.value.title,
      description: form.value.description,
      price: form.value.price,
      categoryId: form.value.categoryId,
      attributes: cleanAttributes,
      images: form.value.images,
    }

    const created = await $fetch<{ id?: string }>('/api/listing/new', {
      method: 'POST',
      body: payload,
    })

    if (created?.id) {
      await navigateTo(`/listings/${created.id}`)
    } else {
      await navigateTo('/')
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// --- Watchers ---

// Handle Category Selection
watch(selectedCategory, (newVal) => {
  const id = newVal?.id ?? null
  form.value.categoryId = id

  if (id) {
    loadCategoryDetails(id)
  } else {
    categoryAttributes.value = []
    form.value.attributes = {}
    attributeErrors.value = {}
    touchedFields.value = {}
  }
})

// --- Helper Functions (Pure Logic) ---

function formatDateForInput(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch {
    return undefined
  }
}

function getAttributeError(def: AttributeDefinition, raw: unknown): string | null {
  // Check Required
  const isEmpty = raw === null || raw === undefined || raw === ''
  if (isEmpty) return def.required ? `Laukas "${def.name}" yra privalomas` : null

  const num = Number(raw)

  switch (def.type) {
    case 'INT':
      if (!Number.isFinite(num) || !Number.isInteger(num))
        return `Laukas "${def.name}" turi būti sveikasis skaičius`
      if (def.minNumber != null && num < def.minNumber)
        return `Laukas "${def.name}" turi būti >= ${def.minNumber}`
      if (def.maxNumber != null && num > def.maxNumber)
        return `Laukas "${def.name}" turi būti <= ${def.maxNumber}`
      return null

    case 'FLOAT':
      if (!Number.isFinite(num)) return `Laukas "${def.name}" turi būti skaičius`
      if (def.minNumber != null && num < def.minNumber)
        return `Laukas "${def.name}" turi būti >= ${def.minNumber}`
      if (def.maxNumber != null && num > def.maxNumber)
        return `Laukas "${def.name}" turi būti <= ${def.maxNumber}`
      return null

    case 'DATE': {
      const parsed = new Date(String(raw))
      if (isNaN(parsed.getTime())) return `Laukas "${def.name}" turi būti teisinga data`

      if (def.minDate) {
        const minD = new Date(def.minDate)
        if (!isNaN(minD.getTime()) && parsed.getTime() < minD.getTime())
          return `Laukas "${def.name}" turi būti >= ${formatDateForInput(def.minDate)}`
      }
      if (def.maxDate) {
        const maxD = new Date(def.maxDate)
        if (!isNaN(maxD.getTime()) && parsed.getTime() > maxD.getTime())
          return `Laukas "${def.name}" turi būti <= ${formatDateForInput(def.maxDate)}`
      }
      return null
    }

    case 'ENUM':
      if (!def.parsedOptions?.includes(String(raw))) {
        return `Laukas "${def.name}" turi būti vienas iš: ${def.parsedOptions?.join(', ')}`
      }
      return null

    case 'BOOLEAN':
      if (typeof raw === 'boolean') return null
      if (['true', 'false', '0', '1'].includes(String(raw))) return null
      return `Laukas "${def.name}" turi būti boolean`

    default:
      return null
  }
}

function parseValueForSubmit(def: AttributeDefinition, raw: unknown): unknown {
  if (raw === null || raw === undefined || raw === '') return null

  switch (def.type) {
    case 'INT':
      return Number.isFinite(+Number(raw)) ? parseInt(String(raw), 10) : raw
    case 'FLOAT':
      return Number.isFinite(+Number(raw)) ? parseFloat(String(raw)) : raw
    case 'BOOLEAN':
      if (typeof raw === 'boolean') return raw
      if (raw === 'true' || raw === '1') return true
      if (raw === 'false' || raw === '0') return false
      return Boolean(raw)
    case 'DATE':
      return new Date(String(raw)).toISOString()
    default:
      return raw
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Naujas skelbimas</h1>
    </div>

    <UCard class="overflow-visible ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg">
      <form class="space-y-8" @submit.prevent="submit">
        <!-- 1. Pagrindinė informacija -->
        <div>
          <h2
            class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500" />
            Pagrindinė informacija
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="sm:col-span-3">
              <UFormField label="Kategorija" required>
                <USelectMenu
                  v-model="selectedCategory"
                  :items="categoryOptions"
                  label-key="name"
                  placeholder="Pasirinkite kategoriją..."
                  icon="i-heroicons-tag"
                  searchable
                  searchable-placeholder="Ieškoti..."
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="sm:col-span-2">
              <UFormField label="Pavadinimas" required>
                <UInput
                  v-model="form.title"
                  placeholder="Pvz.: Audi A6 S-Line, 2018 m."
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="sm:col-span-1">
              <UFormField label="Kaina" required>
                <UInput
                  v-model="form.price"
                  type="number"
                  placeholder="0.00"
                  icon="i-heroicons-currency-euro"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="sm:col-span-3">
              <UFormField label="Aprašymas">
                <UTextarea
                  v-model="form.description"
                  :rows="6"
                  placeholder="Automobilio būklė, privalumai, defektai..."
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <hr class="border-gray-200 dark:border-gray-800 my-6" >

        <!-- 1.5 Nuotraukos -->
        <div>
          <h2
            class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-photo" class="w-5 h-5 text-primary-500" />
            Nuotraukos
          </h2>

          <div class="space-y-4">
            <div class="flex items-center justify-center w-full">
              <UFileUpload
                v-model="files"
                multiple
                accept="image/*"
                :ui="{ wrapper: 'w-full' }"
                label="Spauskite čia arba įkelkite nuotraukas"
                icon="i-heroicons-cloud-arrow-up"
                @change="handleFileChange"
              />
            </div>

            <!-- Previews -->
            <div v-if="form.images.length" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                v-for="(img, index) in form.images"
                :key="index"
                class="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden"
              >
                <img :src="img" class="w-full h-full object-cover" >
                <button
                  type="button"
                  class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="form.images.splice(index, 1)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr v-if="categoryAttributes.length" class="border-gray-200 dark:border-gray-800 my-6" >

        <!-- 2. Specifikacijos -->
        <div v-if="categoryAttributes.length">
          <h2
            class="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-adjustments-horizontal" class="w-5 h-5 text-primary-500" />
            Specifikacija
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="def in categoryAttributes" :key="def.id">
              <UFormField :label="def.name + (def.required ? ' *' : '')">
                <!-- Number Inputs -->
                <template v-if="def.type === 'INT' || def.type === 'FLOAT'">
                  <UInput
                    v-model.number="form.attributes[def.key] as number | undefined"
                    type="number"
                    :placeholder="def.name"
                    :min="def.minNumber ?? undefined"
                    :max="def.maxNumber ?? undefined"
                    class="w-full"
                    @blur="handleFieldBlur(def.key)"
                  />
                  <p
                    v-if="def.minNumber != null || def.maxNumber != null"
                    class="mt-1 text-xs text-gray-500"
                  >
                    Ribos: {{ def.minNumber ?? '-' }} — {{ def.maxNumber ?? '-' }}
                  </p>
                </template>

                <!-- Boolean (Yes/No) -->
                <template v-else-if="def.type === 'BOOLEAN'">
                  <USelect
                    v-model="form.attributes[def.key] as boolean | undefined"
                    :items="[
                      { label: 'Taip', value: true },
                      { label: 'Ne', value: false },
                    ]"
                    placeholder="-"
                    class="w-full"
                    @blur="handleFieldBlur(def.key)"
                  />
                </template>

                <!-- Date -->
                <template v-else-if="def.type === 'DATE'">
                  <UInput
                    v-model="form.attributes[def.key] as string | undefined"
                    type="date"
                    :min="formatDateForInput(def.minDate)"
                    :max="formatDateForInput(def.maxDate)"
                    class="w-full"
                    @blur="handleFieldBlur(def.key)"
                  />
                  <p
                    v-if="def.minDate != null || def.maxDate != null"
                    class="mt-1 text-xs text-gray-500"
                  >
                    Ribos: {{ formatDateForInput(def.minDate) ?? '-' }} —
                    {{ formatDateForInput(def.maxDate) ?? '-' }}
                  </p>
                </template>

                <!-- Enum (Select) -->
                <template v-else-if="def.type === 'ENUM'">
                  <USelect
                    v-model="form.attributes[def.key] as string | undefined"
                    :items="(def.parsedOptions || []).map((o) => ({ label: o, value: o }))"
                    placeholder="Pasirinkite..."
                    class="w-full"
                    @blur="handleFieldBlur(def.key)"
                  />
                </template>

                <!-- Default Text Input -->
                <template v-else>
                  <UInput
                    v-model="form.attributes[def.key] as string | undefined"
                    :placeholder="def.name"
                    class="w-full"
                    @blur="handleFieldBlur(def.key)"
                  />
                </template>

                <!-- Error Message -->
                <p v-if="shouldShowError(def.key)" class="text-xs text-red-500 mt-1">
                  {{ attributeErrors[def.key] }}
                </p>
              </UFormField>
            </div>
          </div>
        </div>

        <hr class="border-gray-200 dark:border-gray-800 my-6" >

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-2">
          <p class="text-sm text-gray-500 italic">
            Kontaktinė informacija bus pridėta automatiškai iš jūsų profilio.
          </p>
          <div class="flex gap-4">
            <UButton
              color="primary"
              size="lg"
              :loading="loading"
              :disabled="hasAttributeErrors || loading"
              type="submit"
              icon="i-heroicons-check"
            >
              Paskelbti
            </UButton>
          </div>
        </div>
      </form>
    </UCard>
  </UContainer>
</template>
