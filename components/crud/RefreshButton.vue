<template>
  <UButton
    @click="$emit('refresh')"
    icon="i-heroicons-cloud-arrow-down"
    variant="outline"
    >Atualizar</UButton
  >
</template>
<script setup>
defineEmits(["refresh"]);
</script>
