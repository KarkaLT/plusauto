<template>
  <div class="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-gray-900">
    <AppHeader />
    <main class="grow">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
