<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Fetch real listings from the API with filters
const { data: listings, pending } = await useFetch('/api/listing/all', {
  query: computed(() => route.query),
  watch: [() => route.query],
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleFilter = (filters: any) => {
  router.push({ query: filters })
}

const sortOptions = [
  { label: 'Naujausi', value: 'createdAt_desc' },
  { label: 'Seniausi', value: 'createdAt_asc' },
  { label: 'Pigiausi', value: 'price_asc' },
  { label: 'Brangiausi', value: 'price_desc' },
]

const selectedSort = computed({
  get: () => sortOptions.find((o) => o.value === route.query.sort) || sortOptions[0],
  set: (val) => {
    router.push({ query: { ...route.query, sort: val?.value } })
  },
})
</script>

<template>
  <div>
    <UContainer class="py-12">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Filters Sidebar -->
        <aside class="hidden lg:block">
          <ListingFilter @filter="handleFilter" />
        </aside>

        <!-- Listings Grid -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ selectedSort?.label ?? 'Naujausi' }} skelbimai
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">Rikiuoti pagal:</span>
              <USelectMenu
                v-model="selectedSort"
                :items="sortOptions"
                placeholder="Rikiuoti"
                size="sm"
                class="w-30"
                :search-input="false"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <!-- Loading state -->
            <template v-if="pending">
              <UCard v-for="n in 6" :key="n" class="animate-pulse">
                <div class="aspect-4/3 bg-gray-200 dark:bg-gray-700" />
                <div class="p-4 space-y-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </UCard>
            </template>

            <!-- Listings -->
            <template v-else-if="listings && listings.length > 0">
              <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
            </template>

            <!-- Empty state -->
            <template v-else>
              <div class="col-span-full text-center py-12">
                <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Skelbimų nerasta
                </h3>
                <p class="text-gray-500 dark:text-gray-400">
                  Šiuo metu neturime jokių skelbimų. Būkite pirmieji kurie sukurs!
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
