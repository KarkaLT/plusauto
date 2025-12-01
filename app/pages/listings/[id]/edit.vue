<script setup lang="ts">
import { ref, computed } from 'vue'

const route = useRoute()
const router = useRouter()
const listingId = route.params.id as string

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

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
  parsedOptions?: string[]
}

interface Category {
  id: string
  name: string
  description?: string | null
}

interface ListingData {
  id: string
  title: string
  description: string | null
  price: number
  categoryId: string
  authorId: string
  category: Category
  images: { id: string; url: string }[]
  attributes: {
    id: string
    value: unknown
    attribute: AttributeDefinition
  }[]
}

// --- State ---
const loading = ref(false)
const uploading = ref(false)
const loadingListing = ref(true)
const categoryAttributes = ref<AttributeDefinition[]>([])
const attributeErrors = ref<Record<string, string | null>>({})
const touchedFields = ref<Record<string, boolean>>({})
const files = ref<File[]>([])
const processedFiles = new Set<string>()
const isDragging = ref(false)

const toast = useToast()

const form = ref({
  title: '',
  description: '',
  price: null as number | null,
  categoryId: null as string | null,
  categoryName: '',
  attributes: {} as Record<string, unknown>,
  images: [] as string[],
})

// Check if user is logged in first
const { user } = useUserSession()

// --- Fetch listing data ---
const { data: listingData, error: listingError } = await useFetch<ListingData>(
  `/api/listing/${listingId}`
)

console.log('Listing data:', listingData.value)
console.log('Listing error:', listingError.value)
console.log('User:', user.value)

if (listingError.value || !listingData.value) {
  console.error('Failed to load listing:', listingError.value)
  throw createError({
    statusCode: 404,
    statusMessage: 'Skelbimas nerastas',
    fatal: true,
  })
}

// Check if current user owns this listing (after user session is loaded)
const isOwner = user.value?.id === listingData.value.authorId
const isAdmin = user.value?.role === 'ADMIN'

console.log('Is owner:', isOwner, 'Is admin:', isAdmin)

if (!isOwner && !isAdmin) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Galite redaguoti tik savo skelbimą',
    fatal: true,
  })
}

console.log('Authorization passed')
// Pre-populate form with existing data
form.value.title = listingData.value.title
form.value.description = listingData.value.description || ''
form.value.price = listingData.value.price
form.value.categoryId = listingData.value.categoryId
form.value.categoryName = listingData.value.category.name
form.value.images = listingData.value.images.map((img) => img.url)

// Pre-populate attributes
categoryAttributes.value = listingData.value.attributes.map((attr) => {
  const def = attr.attribute
  // Pre-process ENUM options
  if (def.type === 'ENUM') {
    const rawOpts = def.options
    let parsed: string[] = []
    try {
      parsed = Array.isArray(rawOpts) ? rawOpts : JSON.parse(String(rawOpts || '[]'))
    } catch {
      /* ignore error */
    }
    return { ...def, parsedOptions: parsed }
  }
  return def
})

// Set attribute values
categoryAttributes.value.forEach((def) => {
  const existingAttr = listingData.value!.attributes.find((a) => a.attribute.key === def.key)
  form.value.attributes[def.key] = existingAttr?.value ?? null
})

loadingListing.value = false

// --- Computed ---
const hasAttributeErrors = computed(() =>
  Object.values(attributeErrors.value).some((error) => !!error)
)

const shouldShowError = (key: string) => {
  return touchedFields.value[key] && attributeErrors.value[key]
}

// --- Methods ---

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

function onDragOver(_e: DragEvent) {
  isDragging.value = true
}

function onDragLeave(_e: DragEvent) {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    const droppedFiles = Array.from(e.dataTransfer.files)
    files.value = [...files.value, ...droppedFiles]
    handleFileChange()
  }
}

async function handleFileChange() {
  if (!files.value.length) return
  uploading.value = true

  const filesToUpload = []
  for (const file of files.value) {
    const key = `${file.name}-${file.size}-${file.lastModified}`
    if (processedFiles.has(key)) continue
    processedFiles.add(key)

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

  if (filesToUpload.length === 0) {
    uploading.value = false
    return
  }

  try {
    const { urls } = await $fetch<{ urls: string[] }>('/api/upload', {
      method: 'POST',
      body: { files: filesToUpload },
    })
    form.value.images.push(...urls)
    files.value = []
  } catch (err) {
    console.error('Upload failed:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to upload files',
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

async function submit() {
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
      attributes: cleanAttributes,
      images: [...form.value.images],
    }

    console.log('Submitting payload:', payload)

    await $fetch(`/api/listing/${listingId}`, {
      method: 'PATCH',
      body: payload,
    })

    toast.add({
      title: 'Sėkmingai',
      description: 'Skelbimas atnaujintas',
      color: 'success',
    })

    await navigateTo(`/listings/${listingId}`)
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Klaida',
      description: 'Nepavyko atnaujinti skelbimo',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

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
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Redaguoti skelbimą</h1>
    </div>

    <UCard
      v-if="!loadingListing"
      class="overflow-visible ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg"
    >
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
                <UInput
                  v-model="form.categoryName"
                  disabled
                  class="w-full"
                  icon="i-heroicons-tag"
                />
                <template #hint>
                  <span class="text-xs text-gray-500">Kategorijos negalima pakeisti</span>
                </template>
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
            <!-- File upload -->
            <div class="flex items-center justify-center w-full">
              <UFileUpload
                v-model="files"
                multiple
                accept="image/*"
                :ui="{ wrapper: 'w-full' }"
                @change="handleFileChange"
              >
                <template #default="{ open }">
                  <div
                    class="flex flex-col w-full p-4 border border-dashed rounded-lg transition-colors cursor-pointer"
                    :class="[
                      isDragging
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    ]"
                    @click="() => open()"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onDrop"
                  >
                    <div
                      v-if="form.images.length > 0"
                      class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-4 cursor-default"
                      @click.stop
                    >
                      <div
                        v-for="(img, index) in form.images"
                        :key="index"
                        class="relative aspect-video rounded overflow-hidden group"
                      >
                        <img
                          :src="img"
                          class="w-full h-full object-cover"
                          :alt="`Image ${index + 1}`"
                        >
                        <button
                          type="button"
                          class="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          @click="removeImage(index)"
                        >
                          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-col items-center justify-center py-4">
                      <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400 mb-2" />
                      <span class="text-sm text-gray-500 font-medium"
                        >Pridėti daugiau nuotraukų</span
                      >
                    </div>
                  </div>
                </template>
              </UFileUpload>
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
          <UButton color="neutral" size="lg" variant="ghost" @click="router.back()">
            Atšaukti
          </UButton>
          <div class="flex gap-4">
            <UButton
              color="primary"
              size="lg"
              :loading="loading || uploading"
              :disabled="hasAttributeErrors || loading || uploading"
              type="submit"
              icon="i-heroicons-check"
            >
              {{ uploading ? 'Įkeliama...' : 'Atnaujinti' }}
            </UButton>
          </div>
        </div>
      </form>
    </UCard>

    <!-- Loading state -->
    <UCard v-else class="overflow-visible ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg">
      <div class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-600" />
      </div>
    </UCard>
  </UContainer>
</template>
