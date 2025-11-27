<script setup lang="ts">
const route = useRoute()
const _id = route.params.id

// Mock data for the listing
const listing = ref({
  id: 1,
  title: 'Audi A6 S-Line Quattro',
  price: 18500,
  images: [
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1200&auto=format&fit=crop',
  ],
  year: 2018,
  fuelType: 'Dyzelinas',
  gearbox: 'Automatinė',
  power: '140 kW',
  mileage: 185000,
  city: 'Vilnius',
  description:
    'Parduodamas puikios būklės automobilis. Visi aptarnavimai atlikti laiku. S-Line apdaila, Matrix LED žibintai, odinis salonas, navigacija, šildomos sėdynės.',
  features: [
    'Klimato kontrolė',
    'Odinės sėdynės',
    'Šildomos sėdynės',
    'Navigacija',
    'LED žibintai',
    'Parkavimo davikliai',
    'Galinio vaizdo kamera',
    'Autopilotas',
  ],
  seller: {
    name: 'Jonas Jonaitis',
    phone: '+370 600 00000',
    email: 'jonas@example.com',
  },
})

const activeImage = ref(0)
const comment = ref('')

const comments = ref([
  { id: 1, author: 'Petras', text: 'Ar kaina derinama?', date: '2024-03-15' },
  { id: 2, author: 'Antanas', text: 'Kada buvo keisti tepalai?', date: '2024-03-14' },
])

function addComment() {
  if (!comment.value) return
  comments.value.push({
    id: comments.value.length + 1,
    author: 'Aš',
    text: comment.value,
    date: new Date().toISOString().split('T')[0]!,
  })
  comment.value = ''
}
</script>

<template>
  <UContainer class="py-8">
    <!-- Breadcrumbs -->
    <div class="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
      <NuxtLink to="/" class="hover:text-primary-600 dark:hover:text-primary-400"
        >Pagrindinis</NuxtLink
      >
      <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
      <NuxtLink to="/" class="hover:text-primary-600 dark:hover:text-primary-400"
        >Automobiliai</NuxtLink
      >
      <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
      <span class="text-gray-900 dark:text-white">{{ listing.title }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Gallery -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div class="aspect-video relative bg-gray-100 dark:bg-gray-900">
            <img
              :src="listing.images[activeImage]"
              :alt="listing.title"
              class="w-full h-full object-cover"
            >
            <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <button
                v-for="(_, index) in listing.images"
                :key="index"
                class="w-2 h-2 rounded-full transition-colors"
                :class="activeImage === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'"
                @click="activeImage = index"
              />
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 p-2">
            <button
              v-for="(img, index) in listing.images"
              :key="index"
              class="aspect-video relative rounded overflow-hidden"
              :class="{ 'ring-2 ring-primary-600': activeImage === index }"
              @click="activeImage = index"
            >
              <img :src="img" class="w-full h-full object-cover" >
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Aprašymas</h2>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {{ listing.description }}
          </p>
        </div>

        <!-- Features -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Ypatybės</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="feature in listing.features"
              :key="feature"
              class="flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <UIcon
                name="i-heroicons-check"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-6">Komentarai</h2>

          <div class="space-y-6 mb-8">
            <div v-for="c in comments" :key="c.id" class="flex gap-4">
              <UAvatar :alt="c.author" size="sm" />
              <div class="flex-grow">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold">{{ c.author }}</span>
                  <span class="text-xs text-gray-500">{{ c.date }}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm">{{ c.text }}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <UAvatar alt="Aš" size="sm" />
            <div class="flex-grow space-y-2">
              <UTextarea v-model="comment" placeholder="Rašyti komentarą..." :rows="3" />
              <div class="flex justify-end">
                <UButton color="primary" @click="addComment"> Skelbti </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Price Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
          <h1 class="text-2xl font-bold mb-2">{{ listing.title }}</h1>
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-6">
            {{ listing.price }} €
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Metai</span>
              <span class="font-medium">{{ listing.year }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Kuras</span>
              <span class="font-medium">{{ listing.fuelType }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Pavarų dėžė</span>
              <span class="font-medium">{{ listing.gearbox }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Galia</span>
              <span class="font-medium">{{ listing.power }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Rida</span>
              <span class="font-medium">{{ listing.mileage }} km</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-gray-500 dark:text-gray-400">Miestas</span>
              <span class="font-medium">{{ listing.city }}</span>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
            <div class="font-bold mb-1">{{ listing.seller.name }}</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {{ listing.seller.phone }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-300">{{ listing.seller.email }}</div>
          </div>

          <UButton block size="lg" color="primary" icon="i-heroicons-phone"> Skambinti </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>
