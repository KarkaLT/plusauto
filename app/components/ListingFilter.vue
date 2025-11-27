<script setup lang="ts">
const filters = ref({
  make: '',
  model: '',
  priceFrom: null,
  priceTo: null,
  yearFrom: null,
  yearTo: null,
  fuelType: [],
})

const makes = ['Audi', 'BMW', 'Mercedes-Benz', 'Toyota', 'Volkswagen', 'Volvo']
const fuelTypes = ['Dyzelinas', 'Benzinas', 'Benzinas/Dujos', 'Elektra', 'Hibridas']
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-bold text-lg">Filtrai</h2>
      <UButton
        v-if="Object.values(filters).some((v) => v && (Array.isArray(v) ? v.length : true))"
        variant="link"
        color="gray"
        size="xs"
        @click="
          filters = {
            make: '',
            model: '',
            priceFrom: null,
            priceTo: null,
            yearFrom: null,
            yearTo: null,
            fuelType: [],
          }
        "
      >
        Išvalyti
      </UButton>
    </div>

    <div class="space-y-6">
      <UFormField label="Markė">
        <USelect v-model="filters.make" :options="makes" placeholder="Pasirinkite markę" />
      </UFormField>

      <UFormField label="Modelis">
        <UInput v-model="filters.model" placeholder="Įveskite modelį" />
      </UFormField>

      <div class="grid grid-cols-2 gap-2">
        <UFormField label="Kaina nuo">
          <UInput v-model="filters.priceFrom" type="number" placeholder="€" />
        </UFormField>
        <UFormField label="Kaina iki">
          <UInput v-model="filters.priceTo" type="number" placeholder="€" />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <UFormField label="Metai nuo">
          <UInput v-model="filters.yearFrom" type="number" placeholder="2000" />
        </UFormField>
        <UFormField label="Metai iki">
          <UInput v-model="filters.yearTo" type="number" placeholder="2024" />
        </UFormField>
      </div>

      <UFormField label="Kuro tipas">
        <div class="space-y-2">
          <UCheckbox
            v-for="type in fuelTypes"
            :key="type"
            v-model="filters.fuelType"
            :value="type"
            :label="type"
          />
        </div>
      </UFormField>

      <UButton block color="primary" size="lg"> Ieškoti </UButton>
    </div>
  </div>
</template>
