<script setup lang="ts">
interface Listing {
  id: string
  title: string
  author: {
    name: string | null
    email: string
  }
  createdAt: string
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface Comment {
  id: string
  content: string
  author: {
    name: string | null
    email: string
  }
  listing: {
    title: string
  }
  createdAt: string
}

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

// Fetch real data
const { data: listings, refresh: refreshListings } = await useAsyncData<Listing[]>('listings', () =>
  $fetch('/api/listing/all')
)
const { data: users, refresh: refreshUsers } = await useAsyncData<User[]>('users', () =>
  $fetch('/api/user/all')
)
const { data: comments, refresh: refreshComments } = await useAsyncData<Comment[]>('comments', () =>
  $fetch('/api/comment/all')
)

const toast = useToast()

console.log('Comments:', comments.value)
console.log('Listings:', listings.value)
console.log('Users:', users.value)

// Computed rows for typing
const listingsRows = computed<Listing[]>(() => listings.value || [])
const usersRows = computed<User[]>(() => users.value || [])
const commentsRows = computed<Comment[]>(() => comments.value || [])

type ColumnBase = {
  accessorKey?: string
  id?: string
  header: string
}

const columnsListings: ColumnBase[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Pavadinimas' },
  { accessorKey: 'author', header: 'Vartotojas' },
  { accessorKey: 'createdAt', header: 'Data' },
  { id: 'actions', header: 'Veiksmai' },
]
const columnsUsers: ColumnBase[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Vardas' },
  { accessorKey: 'email', header: 'El. paštas' },
  { accessorKey: 'role', header: 'Rolė' },
  { id: 'actions', header: 'Veiksmai' },
]
const columnsComments: ColumnBase[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'content', header: 'Komentaras' },
  { accessorKey: 'author', header: 'Autorius' },
  { accessorKey: 'listing', header: 'Skelbimas' },
  { id: 'actions', header: 'Veiksmai' },
]
async function deleteItem(type: 'listing' | 'user' | 'comment', id: string) {
  const actions: Record<
    'listing' | 'user' | 'comment',
    {
      url: (id: string) => string
      refresh: () => Promise<void>
      successDescription: string
    }
  > = {
    listing: {
      url: (id) => `/api/listing/${id}`,
      refresh: refreshListings,
      successDescription: 'Skelbimas buvo ištrintas.',
    },
    user: {
      url: (id) => `/api/user/${id}`,
      refresh: refreshUsers,
      successDescription: 'Vartotojas buvo ištrintas.',
    },
    comment: {
      url: (id) => `/api/comment/${id}`,
      refresh: refreshComments,
      successDescription: 'Komentaras buvo ištrintas.',
    },
  }

  const action = actions[type]

  if (!action) {
    toast.add({
      title: 'Klaida',
      description: 'Nenurodyta arba neteisinga rūšis.',
      color: 'error',
    })
    return
  }

  try {
    await $fetch(action.url(id), { method: 'DELETE' }).catch((err: unknown) => {
      // Normalize errors coming from server or fetch
      type HttpErrorLike = { data?: { message?: string } }
      const message =
        (err as HttpErrorLike)?.data?.message || (err as Error)?.message || String(err)
      toast.add({
        title: 'Klaida',
        description: message || 'Įvyko klaida trinant įrašą.',
        color: 'error',
      })
      throw new Error(message)
    })
    await action.refresh()
    toast.add({
      title: 'Sėkmingai ištrinta',
      description: action.successDescription,
      color: 'success',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    toast.add({
      title: 'Klaida',
      description: message || 'Įvyko klaida trinant įrašą.',
      color: 'error',
    })
  }
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

          <UTable :data="listingsRows" :columns="columnsListings">
            <template #author-cell="{ row }">
              {{ row.original.author.name }}
            </template>
            <template #createdAt-cell="{ row }">
              {{ new Date(row.original.createdAt).toLocaleString() }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-2">
                <UButton
                  color="primary"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  size="xs"
                  :to="`/listings/${row.original.id}`"
                  target="_blank"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('listing', row.original.id)"
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

          <UTable :data="usersRows" :columns="columnsUsers">
            <template #actions-cell="{ row }">
              <div class="flex gap-2">
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('user', row.original.id)"
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

          <UTable :data="commentsRows" :columns="columnsComments">
            <template #author-cell="{ row }">
              {{
                (row as unknown as Comment).author?.name ||
                (row as unknown as Comment).author?.email ||
                'Unknown'
              }}
            </template>
            <template #listing-cell="{ row }">
              {{ (row as unknown as Comment).listing?.title || 'Unknown' }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-2">
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="deleteItem('comment', row.original.id)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>
    </UTabs>
  </UContainer>
</template>
