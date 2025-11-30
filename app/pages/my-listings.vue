<script setup lang="ts">
const { data: listings, pending } = await useFetch('/api/listing/mine')
</script>

<template>
  <div>
    <UContainer class="py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Loading state -->
        <template v-if="pending">
          <UCard v-for="n in 3" :key="n" class="animate-pulse">
            <div class="aspect-4/3 bg-gray-200 dark:bg-gray-700" />
            <div class="p-4 space-y-3">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </UCard>
        </template>

        <!-- Listings -->
        <template v-else-if="listings && listings.length > 0">
          <div class="col-span-full">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Mano skelbimai</h2>
          </div>
          <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
        </template>

        <!-- Empty state -->
        <template v-else>
          <div class="col-span-full text-center py-12">
            <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Jūs neturite skelbimų
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Sukurkite savo pirmąjį skelbimą ir parduokite automobilį greičiau!
            </p>
            <UButton to="/listings/create" color="primary" variant="solid">
              Kurti skelbimą
            </UButton>
          </div>
        </template>
      </div>
    </UContainer>
  </div>
</template>
