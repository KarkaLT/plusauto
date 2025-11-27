<script setup lang="ts">
defineProps<{
  listing: {
    id: number
    title: string
    price: number
    image: string
    year: number
    fuelType: string
    gearbox: string
    power: string
    mileage: number
    city: string
  }
}>()
</script>

<template>
  <NuxtLink :to="`/listings/${listing.id}`" class="block group">
    <UCard
      :ui="{ body: { padding: 'p-0' } }"
      class="overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div class="relative aspect-[4/3] overflow-hidden">
        <img
          :src="listing.image"
          :alt="listing.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        >
        <div
          class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"
        >
          <p class="text-white font-bold text-xl">{{ listing.price }} €</p>
        </div>
      </div>

      <div class="p-4">
        <h3
          class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        >
          {{ listing.title }}
        </h3>

        <div class="grid grid-cols-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            <span>{{ listing.year }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-beaker" class="w-4 h-4" />
            <span>{{ listing.fuelType }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-cog" class="w-4 h-4" />
            <span>{{ listing.gearbox }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
            <span>{{ listing.power }}</span>
          </div>
        </div>

        <div
          class="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3"
        >
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
            <span>{{ listing.city }}</span>
          </div>
          <span>{{ listing.mileage }} km</span>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
