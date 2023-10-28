<template>
  <h1>
    <p class="text-primary font-semibold">{{ title }}</p>
  </h1>
</template>
<script setup>
const props = defineProps({
  title: String,
});
</script>
