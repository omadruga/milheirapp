<template>
  <USlideover v-model="isOpen">
    <UCard
      class="flex flex-col flex-1"
      :ui="{
        body: { base: 'flex-1' },
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <h2>Adicionar CPF</h2>
      </template>
      <UForm :validate="validate" :state="state" @submit="save">
        <UFormGroup label="Nome" name="name" class="mb-4">
          <UInput v-model="state.name" />
        </UFormGroup>
        <UFormGroup label="CPF" name="cpf">
          <UInput v-model="state.cpf" v-maska data-maska="###.###.###-##" />
        </UFormGroup>
        <UInput v-model="state.id" type="hidden" />

        <div class="flex justify-evenly mt-4">
          <UButton variant="soft" @click="isOpen = false">Cancelar</UButton>
          <UButton type="submit">Salvar</UButton>
        </div>
      </UForm>
    </UCard>
  </USlideover>
</template>
<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui/dist/runtime/types";
const toast = useToast();
defineExpose({ add, edit });
const emit = defineEmits(["refresh"]);
const isOpen = ref(false);
const state = ref({
  id: undefined,
  name: undefined,
  cpf: undefined,
});

const validate = (state: any): FormError[] => {
  const errors = [];
  if (!state.name) errors.push({ path: "name", message: "Informe o nome" });
  if (!state.cpf) {
    errors.push({ path: "cpf", message: "Informe um CPF válido" });
  } else {
    if (state.cpf.length != 14) {
      errors.push({ path: "cpf", message: "Informe um CPF válido" });
    }
  }
  return errors;
};

function add() {
  state.value.id = undefined;
  state.value.name = undefined;
  state.value.cpf = undefined;
  isOpen.value = true;
}

function edit(id: any, name: any, cpf: any) {
  state.value.id = id;
  state.value.name = name;
  state.value.cpf = cpf;
  isOpen.value = true;
}

async function save(event: FormSubmitEvent<any>) {
  const { data: result, error } = useFetch("/api/cpfs", {
    method: "POST",
    body: JSON.stringify({
      id: state.value.id,
      name: state.value.name,
      cpf: state.value.cpf,
    }),
  });
  if (!error.value) {
    if (state.value.id) {
      toast.add({
        title: "CPF atualizado com sucesso",
        icon: "i-heroicons-check-circle",
      });
    } else {
      toast.add({
        title: "CPF cadastrado com sucesso",
        icon: "i-heroicons-check-circle",
      });
    }
    emit("refresh");
    isOpen.value = false;
  } else {
    if (error.value?.statusCode == 422) {
      toast.add({
        title: "CPF já está sendo usado",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}
</script>
