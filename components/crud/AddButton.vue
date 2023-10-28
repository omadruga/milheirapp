<template>
  <UButton @click="$emit('add')" icon="i-heroicons-document-plus" trailing
    >Cadastrar</UButton
  >
</template>
<script setup>
defineEmits(["add"]);
</script>
