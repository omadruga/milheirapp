<template>
  <UButton @click="$emit('add')" icon="i-heroicons-document-plus" trailing>{{
    title
  }}</UButton>
</template>
<script setup>
defineProps({
  title: {
    type: String,
    default: "Cadastrar",
  },
});
defineEmits(["add"]);
</script>
