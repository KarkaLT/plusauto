<script setup lang="ts">
const { listing } = defineProps<{
  listing: {
    id: string
    title: string
    price: number
    image: string | null
  }
}>()
</script>

<template>
  <NuxtLink :to="`/listings/${listing.id}`" class="block group">
    <UCard class="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div class="relative aspect-4/3 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <!-- Image or placeholder -->
        <template v-if="listing.image">
          <img
            :src="listing.image"
            :alt="listing.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-sm"
          >
        </template>
        <template v-else>
          <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <UIcon name="i-heroicons-camera" class="w-16 h-16 mb-2" />
            <span class="text-sm font-medium">Nuotraukų nėra</span>
          </div>
        </template>

        <div
          class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4"
        >
          <p class="text-white font-bold text-xl">{{ listing.price }} €</p>
        </div>
      </div>

      <div class="p-4">
        <h3
          class="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        >
          {{ listing.title }}
        </h3>
      </div>
    </UCard>
  </NuxtLink>
</template>
