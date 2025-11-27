<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth', // Should be admin middleware
})

const items = [
  {
    label: 'Skelbimai',
    icon: 'i-heroicons-list-bullet',
    slot: 'listings',
  },
  {
    label: 'Vartotojai',
    icon: 'i-heroicons-users',
    slot: 'users',
  },
  {
    label: 'Komentarai',
    icon: 'i-heroicons-chat-bubble-left-right',
    slot: 'comments',
  },
]

// Mock Data
const listings = ref([
  { id: 1, title: 'Audi A6', user: 'Jonas', status: 'Active', date: '2024-03-15' },
  { id: 2, title: 'BMW 530d', user: 'Petras', status: 'Pending', date: '2024-03-14' },
])

const users = ref([
  { id: 1, name: 'Jonas Jonaitis', email: 'jonas@example.com', role: 'User' },
  { id: 2, name: 'Admin', email: 'admin@plusauto.lt', role: 'Admin' },
])

const comments = ref([
  { id: 1, text: 'Ar kaina derinama?', user: 'Petras', listing: 'Audi A6', date: '2024-03-15' },
  { id: 2, text: 'Keitimas domina?', user: 'Antanas', listing: 'BMW 530d', date: '2024-03-14' },
])

const columnsListings = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Pavadinimas' },
  { key: 'user', label: 'Vartotojas' },
  { key: 'status', label: 'Būsena' },
  { key: 'actions' },
]
const columnsUsers = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Vardas' },
  { key: 'email', label: 'El. paštas' },
  { key: 'role', label: 'Rolė' },
  { key: 'actions' },
]
const columnsComments = [
  { key: 'id', label: 'ID' },
  { key: 'text', label: 'Komentaras' },
  { key: 'user', label: 'Autorius' },
  { key: 'listing', label: 'Skelbimas' },
  { key: 'actions' },
]

function deleteItem(type: string, id: number) {
  // TODO: Implement delete logic
  console.log(`Delete ${type} ${id}`)
}
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-8">Administratoriaus pultas</h1>

    <UTabs :items="items" class="w-full">
      <template #listings>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-900 dark:text-white">Skelbimų valdymas</h3>
              <UInput icon="i-heroicons-magnifying-glass" placeholder="Ieškoti..." size="sm" />
            </div>
          </template>

          <UTable :rows="listings" :columns="columnsListings">
            <template #actions-data="{ row }">
              <div class="flex gap-2">
                <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" />
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('listing', row.id)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <template #users>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-900 dark:text-white">Vartotojų valdymas</h3>
              <UInput icon="i-heroicons-magnifying-glass" placeholder="Ieškoti..." size="sm" />
            </div>
          </template>

          <UTable :rows="users" :columns="columnsUsers">
            <template #actions-data="{ row }">
              <div class="flex gap-2">
                <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" />
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('user', row.id)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <template #comments>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-900 dark:text-white">Komentarų valdymas</h3>
              <UInput icon="i-heroicons-magnifying-glass" placeholder="Ieškoti..." size="sm" />
            </div>
          </template>

          <UTable :rows="comments" :columns="columnsComments">
            <template #actions-data="{ row }">
              <div class="flex gap-2">
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('comment', row.id)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>
    </UTabs>
  </UContainer>
</template>
