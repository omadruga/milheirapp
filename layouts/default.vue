<template>
  <div>
    <NuxtLoadingIndicator />
    <UContainer>
      <Header />
      <slot />
    </UContainer>
    <UNotifications />
  </div>
</template>

<script setup></script>
