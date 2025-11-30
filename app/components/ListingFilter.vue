<script setup lang="ts">
import { useCategories } from '~/app/composables/useCategories'
import {
  useAttributeDefinitions,
  type AttributeDefinition,
} from '~/app/composables/useAttributeDefinitions'

interface Category {
  id: string
  description: string | undefined
  name: string
}

const emit = defineEmits(['filter'])
const route = useRoute()

// Categories
const { categories } = useCategories()
const selectedCategoryId = ref<Category | undefined>(
  categories.value.find((category) => category.id === route.query.categoryId)
)

const selectedCategoryIdStr = computed(() => selectedCategoryId.value?.id)

// Attributes
const { attributes, pending: pendingAttributes } = useAttributeDefinitions(selectedCategoryIdStr)

// Filter state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filters = ref<Record<string, any>>({})

// Initialize filters from URL
watch(
  () => route.query,
  (newQuery) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newFilters: Record<string, any> = {}

    if (newQuery.categoryId && newQuery.categoryId !== selectedCategoryId.value?.id) {
      selectedCategoryId.value = categories.value.find(
        (category) => category.id === newQuery.categoryId
      )
    }

    for (const [key, value] of Object.entries(newQuery)) {
      if (key === 'categoryId' || key === 'page' || key === 'limit' || key === 'sort') continue
      newFilters[key] = value
    }

    // Only update if different to avoid loops
    if (JSON.stringify(newFilters) !== JSON.stringify(filters.value)) {
      filters.value = newFilters
    }
  },
  { immediate: true }
)

// Watch for category changes to reset filters
watch(selectedCategoryId, (newCategory, oldCategory) => {
  if (newCategory?.id !== oldCategory?.id) {
    filters.value = {}
    applyFilters()
  }
})

const applyFilters = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { ...filters.value }
  console.log(selectedCategoryId.value)
  if (selectedCategoryId.value) {
    query.categoryId = selectedCategoryId.value.id
  }

  emit('filter', query)
}

const clearFilters = () => {
  filters.value = {}
  selectedCategoryId.value = undefined
  applyFilters()
}

// Helper to get options for ENUM attributes
const getOptions = (attribute: AttributeDefinition) => {
  if (attribute.options && typeof attribute.options === 'object') {
    // Handle both array of strings and array of objects if needed
    // Assuming options is stored as JSON array of strings or objects with label/value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return attribute.options as any[]
  }
  return []
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-bold text-lg">Filtrai</h2>
      <UButton
        v-if="selectedCategoryId || Object.keys(filters).length > 0"
        variant="link"
        color="neutral"
        size="xs"
        @click="clearFilters"
      >
        Išvalyti
      </UButton>
    </div>

    <div class="space-y-6">
      <!-- Category Selection -->
      <UFormField label="Kategorija">
        <USelectMenu
          v-model="selectedCategoryId"
          :items="categories"
          label-key="name"
          placeholder="Pasirinkite kategoriją"
          class="w-full"
        />
      </UFormField>

      <!-- Dynamic Attributes -->
      <div v-if="pendingAttributes" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>

      <template v-else-if="selectedCategoryId && attributes.length > 0">
        <div v-for="attr in attributes" :key="attr.id" class="space-y-2">
          <!-- STRING -->
          <UFormField v-if="attr.type === 'STRING'" :label="attr.name">
            <UInput v-model="filters[attr.key]" :placeholder="attr.name" class="w-full" />
          </UFormField>

          <!-- INT / FLOAT (Range) -->
          <div v-else-if="attr.type === 'INT' || attr.type === 'FLOAT'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{{
              attr.name
            }}</label>
            <div class="grid grid-cols-2 gap-2">
              <UInput v-model="filters[`${attr.key}_min`]" type="number" placeholder="Nuo" />
              <UInput v-model="filters[`${attr.key}_max`]" type="number" placeholder="Iki" />
            </div>
          </div>

          <!-- BOOLEAN -->
          <UFormField v-else-if="attr.type === 'BOOLEAN'">
            <UCheckbox v-model="filters[attr.key]" :label="attr.name" />
          </UFormField>

          <!-- DATE (Range) -->
          <div v-else-if="attr.type === 'DATE'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{{
              attr.name
            }}</label>
            <div class="grid grid-cols-2 gap-2">
              <UInput v-model="filters[`${attr.key}_from`]" type="date" />
              <UInput v-model="filters[`${attr.key}_to`]" type="date" />
            </div>
          </div>

          <!-- ENUM -->
          <UFormField v-else-if="attr.type === 'ENUM'" :label="attr.name">
            <USelectMenu
              v-model="filters[attr.key]"
              :items="getOptions(attr)"
              :placeholder="`Pasirinkite ${attr.name.toLowerCase()}`"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <div v-else-if="selectedCategoryId" class="text-sm text-gray-500 text-center py-4">
        Ši kategorija neturi papildomų filtrų.
      </div>

      <UButton block color="primary" size="lg" @click="applyFilters"> Ieškoti </UButton>
    </div>
  </div>
</template>
