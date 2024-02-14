<template>
  <div class="flex gap-3 align-middle items-center">
    <CrudMyTitle :title="title" />
    <UInput
      placeholder="Filtrar"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <UButtonGroup>
      <CrudRefreshButton @refresh="$emit('refresh')" />
      <CrudAddButton v-if="loggedIn" @add="$emit('add')" />
    </UButtonGroup>
  </div>
</template>
<script setup>
const { loggedIn, user, session, clear } = useUserSession();
defineProps(["modelValue", "title"]);
defineEmits(["update:modelValue", "add", "refresh"]);
</script>
