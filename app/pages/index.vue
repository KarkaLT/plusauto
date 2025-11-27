<script setup lang="ts">
const listings = [
  {
    id: 1,
    title: 'Audi A6 S-Line Quattro',
    price: 18500,
    image:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop',
    year: 2018,
    fuelType: 'Dyzelinas',
    gearbox: 'Automatinė',
    power: '140 kW',
    mileage: 185000,
    city: 'Vilnius',
  },
  {
    id: 2,
    title: 'BMW 530d xDrive M Sport',
    price: 24900,
    image:
      'https://images.unsplash.com/photo-1555215695-3004980adade?q=80&w=800&auto=format&fit=crop',
    year: 2019,
    fuelType: 'Dyzelinas',
    gearbox: 'Automatinė',
    power: '195 kW',
    mileage: 142000,
    city: 'Kaunas',
  },
  {
    id: 3,
    title: 'Toyota RAV4 Hybrid',
    price: 28500,
    image:
      'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?q=80&w=800&auto=format&fit=crop',
    year: 2021,
    fuelType: 'Hibridas',
    gearbox: 'Automatinė',
    power: '160 kW',
    mileage: 45000,
    city: 'Klaipėda',
  },
  {
    id: 4,
    title: 'Volvo XC60 Inscription',
    price: 32000,
    image:
      'https://images.unsplash.com/photo-1605218427360-6961d907175d?q=80&w=800&auto=format&fit=crop',
    year: 2020,
    fuelType: 'Dyzelinas',
    gearbox: 'Automatinė',
    power: '173 kW',
    mileage: 89000,
    city: 'Vilnius',
  },
  {
    id: 5,
    title: 'Volkswagen Passat R-Line',
    price: 15900,
    image:
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop',
    year: 2017,
    fuelType: 'Dyzelinas',
    gearbox: 'Automatinė',
    power: '140 kW',
    mileage: 210000,
    city: 'Šiauliai',
  },
  {
    id: 6,
    title: 'Mercedes-Benz E220d AMG Line',
    price: 29500,
    image:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    year: 2020,
    fuelType: 'Dyzelinas',
    gearbox: 'Automatinė',
    power: '143 kW',
    mileage: 98000,
    city: 'Kaunas',
  },
]
</script>

<template>
  <div>
    <UContainer class="py-12">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Filters Sidebar -->
        <aside class="hidden lg:block">
          <ListingFilter />
        </aside>

        <!-- Listings Grid -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Naujausi skelbimai</h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">Rikiuoti pagal:</span>
              <USelectMenu
                :options="['Naujausi', 'Pigiausi', 'Brangiausi', 'Rida', 'Metai']"
                placeholder="Rikiuoti"
                size="sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
          </div>

          <div class="mt-8 flex justify-center">
            <UButton variant="outline" color="gray" size="lg"> Rodyti daugiau </UButton>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
