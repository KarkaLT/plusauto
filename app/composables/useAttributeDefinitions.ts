export interface AttributeDefinition {
  id: string
  categoryId: string
  name: string
  key: string
  type: 'STRING' | 'INT' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'ENUM' | 'JSON'
  required: boolean
  options?: unknown
  minNumber?: number | null
  maxNumber?: number | null
  minDate?: string | Date | null
  maxDate?: string | Date | null
}

interface CategoryResponse {
  id: string
  name: string
  description?: string | null
  attributes: AttributeDefinition[]
}

export const useAttributeDefinitions = (categoryId: Ref<string | undefined>) => {
  const {
    data: category,
    pending,
    error,
    refresh,
  } = useFetch<CategoryResponse>(
    () => (categoryId.value ? `/api/category/${categoryId.value}` : ''),
    {
      key: 'category-attributes',
      watch: [categoryId],
      immediate: !!categoryId.value,
    }
  )

  const attributes = computed(() => category.value?.attributes || [])

  return {
    attributes,
    pending,
    error,
    refresh,
  }
}
