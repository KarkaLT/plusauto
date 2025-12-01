<script setup lang="ts">
const route = useRoute()
const _id = route.params.id
const { loggedIn, user } = useUserSession()

interface ListingResponse {
  id: string
  title: string
  price: number
  description: string
  images: { url: string }[]
  attributes: {
    value: string | number | boolean
    attribute: {
      name: string
      key: string
      type: string
    }
  }[]
  author: {
    id: string
    name: string | null
    email: string
    phoneNumber: string | null
  }
  category: {
    name: string
  }
}

interface CommentResponse {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  authorId: string
  author: {
    id: string
    name: string | null
  }
  replies?: CommentResponse[]
}

interface DisplayComment {
  id: string
  author: string
  authorId: string
  text: string
  date: string
  isEditing?: boolean
  replies?: DisplayComment[]
}

const { data: listing, error } = await useFetch(`/api/listing/${_id}`, {
  transform: (data: ListingResponse) => {
    // Separate attributes into features (boolean true) and specifications (others)
    const features: string[] = []
    const specifications: { label: string; value: string | number }[] = []

    data.attributes.forEach((attr) => {
      if (attr.attribute.type === 'BOOLEAN') {
        if (attr.value === true) {
          features.push(attr.attribute.name)
        }
      } else {
        // For non-boolean attributes, add to specifications
        // You might want to format dates or other types here if needed
        specifications.push({
          label: attr.attribute.name,
          value: attr.value as string | number,
        })
      }
    })

    return {
      ...data,
      authorId: data.author?.id || null,
      images: data.images.map((img) => img.url),
      features,
      specifications,
      seller: {
        name: data.author.name,
        phone: data.author.phoneNumber,
        email: data.author.email,
      },
    }
  },
})

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Listing not found',
    fatal: true,
  })
}

const activeImage = ref(0)
const comment = ref('')
const isPosting = ref(false)
const editingContent = ref<{ [key: string]: string }>({})
const isDeleteModalOpen = ref(false)
const commentToDelete = ref<string | null>(null)
const isListingDeleteModalOpen = ref(false)
const isDeletingListing = ref(false)

// Fetch comments from API
const {
  data: rawCommentsData,
  refresh: refreshComments,
  pending: loadingComments,
} = await useFetch<CommentResponse[]>(`/api/comment/all`, {
  query: { listingId: _id },
})

function transformComment(comment: CommentResponse): DisplayComment {
  return {
    id: comment.id,
    author: comment.author.name || 'Anonimas',
    authorId: comment.authorId,
    text: comment.content,
    date: formatDate(comment.createdAt),
    replies: comment.replies?.map(transformComment),
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const comments = computed<DisplayComment[]>(() => {
  if (!rawCommentsData.value) return []
  return rawCommentsData.value.map(transformComment)
})

const toast = useToast()

async function addComment() {
  if (!comment.value.trim()) return
  if (!loggedIn.value) {
    navigateTo('/auth/login')
    return
  }

  isPosting.value = true
  try {
    await $fetch('/api/comment/new', {
      method: 'POST',
      body: {
        listingId: _id,
        content: comment.value,
      },
    })

    comment.value = ''
    await refreshComments()
  } catch (err) {
    console.error('Failed to post comment:', err)
    toast.add({
      title: 'Klaida',
      description: 'Nepavyko paskelbti komentaro. Bandykite dar kartą.',
      color: 'error',
    })
  } finally {
    isPosting.value = false
  }
}

function startEditing(commentId: string, currentText: string) {
  editingContent.value[commentId] = currentText
}

function cancelEditing(commentId: string) {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete editingContent.value[commentId]
}

async function saveEdit(commentId: string) {
  const newContent = editingContent.value[commentId]?.trim()
  if (!newContent) return

  try {
    await $fetch(`/api/comment/${commentId}`, {
      method: 'PATCH',
      body: {
        content: newContent,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete editingContent.value[commentId]
    await refreshComments()
  } catch (err) {
    console.error('Failed to update comment:', err)
    toast.add({
      title: 'Klaida',
      description: 'Nepavyko atnaujinti komentaro. Bandykite dar kartą.',
      color: 'error',
    })
  }
}

async function deleteComment(commentId: string) {
  commentToDelete.value = commentId
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!commentToDelete.value) return

  try {
    await $fetch(`/api/comment/${commentToDelete.value}`, {
      method: 'DELETE',
    })

    await refreshComments()
  } catch (err) {
    console.error('Failed to delete comment:', err)
    toast.add({
      title: 'Klaida',
      description: 'Nepavyko ištrinti komentaro. Bandykite dar kartą.',
      color: 'error',
    })
  } finally {
    isDeleteModalOpen.value = false
    commentToDelete.value = null
  }
}

function isOwnComment(authorId: string): boolean {
  return loggedIn.value && user.value?.id === authorId
}

function canEditListing(): boolean {
  // Only owner
  return loggedIn.value && user.value?.id === listing.value?.authorId
}

function canDeleteListing(): boolean {
  // Owner or admin
  return (
    loggedIn.value && (user.value?.id === listing.value?.authorId || user.value?.role === 'ADMIN')
  )
}

async function deleteListing() {
  isListingDeleteModalOpen.value = true
}

async function confirmDeleteListing() {
  isDeletingListing.value = true
  try {
    await $fetch(`/api/listing/${_id}`, { method: 'DELETE' })
    navigateTo('/')
  } catch (err) {
    console.error('Failed to delete listing:', err)
    toast.add({
      title: 'Klaida',
      description: 'Nepavyko ištrinti skelbimo. Bandykite dar kartą.',
      color: 'error',
    })
  } finally {
    isListingDeleteModalOpen.value = false
    isDeletingListing.value = false
  }
}
</script>

<template>
  <UContainer v-if="listing" class="py-8">
    <!-- Breadcrumbs -->
    <div class="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
      <NuxtLink to="/" class="hover:text-primary-600 dark:hover:text-primary-400"
        >Pagrindinis</NuxtLink
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
            <template v-if="listing.images.length > 0">
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
            </template>
            <template v-else>
              <div
                class="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-700"
              >
                <UIcon name="i-heroicons-camera" class="w-16 h-16 mb-2" />
                <span class="text-sm font-medium">Nuotraukų nėra</span>
              </div>
            </template>
          </div>
          <div v-if="listing.images.length > 0" class="grid grid-cols-4 gap-2 p-2">
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
        <div v-if="listing.description" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Aprašymas</h2>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {{ listing.description }}
          </p>
        </div>

        <!-- Features -->
        <div
          v-if="listing.features.length > 0"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
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

          <!-- Loading state -->
          <div v-if="loadingComments" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-600" />
          </div>

          <!-- Comments list -->
          <div v-else-if="comments.length > 0" class="space-y-6 mb-8">
            <div v-for="c in comments" :key="c.id" class="flex gap-4">
              <UAvatar :alt="c.author" size="sm" />
              <div class="grow">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold">{{ c.author }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">{{ c.date }}</span>
                    <!-- Edit/Delete buttons for own comments or admin -->
                    <div
                      v-if="
                        (isOwnComment(c.authorId) || user?.role === 'ADMIN') &&
                        !editingContent[c.id]
                      "
                      class="flex gap-1"
                    >
                      <UButton
                        v-if="isOwnComment(c.authorId) && !editingContent[c.id]"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-pencil"
                        @click="startEditing(c.id, c.text)"
                      />
                      <UButton
                        size="xs"
                        color="error"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        @click="deleteComment(c.id)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Display mode -->
                <p v-if="!editingContent[c.id]" class="text-gray-600 dark:text-gray-300 text-sm">
                  {{ c.text }}
                </p>

                <!-- Edit mode -->
                <div v-else class="space-y-2">
                  <UTextarea v-model="editingContent[c.id]" :rows="3" class="w-full" />
                  <div class="flex gap-2">
                    <UButton size="xs" color="primary" @click="saveEdit(c.id)"> Išsaugoti </UButton>
                    <UButton size="xs" color="neutral" variant="ghost" @click="cancelEditing(c.id)">
                      Atšaukti
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            Dar nėra komentarų. Būkite pirmas!
          </div>

          <!-- Comment form (only if logged in) -->
          <div v-if="loggedIn" class="flex gap-4 mt-6">
            <UAvatar :alt="user?.name || 'Aš'" size="sm" />
            <div class="grow space-y-2">
              <UTextarea
                v-model="comment"
                placeholder="Rašyti komentarą..."
                :rows="3"
                class="w-full"
              />
              <div class="flex justify-end">
                <UButton
                  color="primary"
                  :loading="isPosting"
                  :disabled="!comment.trim() || isPosting"
                  @click="addComment"
                >
                  Skelbti
                </UButton>
              </div>
            </div>
          </div>

          <!-- Login prompt if not logged in -->
          <div v-else class="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Norite komentuoti? Prisijunkite arba užsiregistruokite.
            </p>
            <NuxtLink to="/login">
              <UButton color="primary"> Prisijungti </UButton>
            </NuxtLink>
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

          <div v-if="listing.specifications.length > 0" class="space-y-4 mb-8">
            <div
              v-for="spec in listing.specifications"
              :key="spec.label"
              class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"
            >
              <span class="text-gray-500 dark:text-gray-400">{{ spec.label }}</span>
              <span class="font-medium">{{ spec.value }}</span>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
            <div class="font-bold mb-1">{{ listing.seller.name }}</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {{ listing.seller.phone }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-300">{{ listing.seller.email }}</div>
          </div>

          <UButton
            v-if="listing.seller.phone"
            block
            size="lg"
            color="primary"
            icon="i-heroicons-phone"
            :to="`tel:${listing.seller.phone}`"
            target="_blank"
          >
            Skambinti
          </UButton>
          <UButton
            v-if="listing.seller.email"
            block
            size="lg"
            color="primary"
            icon="i-heroicons-envelope"
            :to="`mailto:${listing.seller.email}`"
            target="_blank"
            class="mt-2"
          >
            Siųsti el. laišką
          </UButton>
          <div class="mt-3 space-y-2">
            <UButton
              v-if="canEditListing()"
              block
              size="lg"
              color="primary"
              variant="outline"
              icon="i-heroicons-pencil"
              :to="`/listings/${_id}/edit`"
            >
              Redaguoti skelbimą
            </UButton>
            <UButton
              v-if="canDeleteListing()"
              block
              size="lg"
              color="error"
              variant="outline"
              icon="i-heroicons-trash"
              @click="deleteListing"
            >
              Ištrinti skelbimą
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Ištrinti komentarą?</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Ar tikrai norite ištrinti šį komentarą? Šio veiksmo negalima atšaukti.
          </p>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="isDeleteModalOpen = false">
              Atšaukti
            </UButton>
            <UButton color="error" @click="confirmDelete"> Ištrinti </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Listing Confirmation Modal -->
    <UModal v-model:open="isListingDeleteModalOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">Ištrinti skelbimą?</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Ar tikrai norite ištrinti šį skelbimą? Šio veiksmo negalima atšaukti.
          </p>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="isListingDeleteModalOpen = false">
              Atšaukti
            </UButton>
            <UButton color="error" :loading="isDeletingListing" @click="confirmDeleteListing">
              Ištrinti
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
