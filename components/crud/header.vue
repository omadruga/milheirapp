<template>
  <div class="flex gap-3 align-middle items-center">
    <CrudMyTitle title="CPFs Administrados" />
    <UInput
      placeholder="Filtrar"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <UButtonGroup>
      <CrudRefreshButton @refresh="$emit('refresh')" />
      <CrudAddButton @add="$emit('add')" />
    </UButtonGroup>
  </div>
</template>
<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue", "add", "refresh"]);
</script>
