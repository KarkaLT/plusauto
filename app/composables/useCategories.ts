export const useCategories = () => {
  const {
    data: categories,
    pending,
    error,
    refresh,
  } = useFetch('/api/category/all', {
    key: 'categories',
    default: () => [],
    transform: (categories) => {
      return categories.map((category) => ({
        ...category,
        description: category.description || undefined,
      }))
    },
  })

  return {
    categories,
    pending,
    error,
    refresh,
  }
}
