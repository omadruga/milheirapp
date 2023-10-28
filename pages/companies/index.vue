<template>
  <div>
    <CrudHeader
      title="Empresas"
      v-model="filter"
      @add="add"
      @refresh="refresh"
    />
    <UTable :rows="filteredCompanies" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhuma Empresa cadastrada</span>
          <CrudAddButton @click="add" />
        </div>
      </template>
      <template #icon-data="{ row }">
        <UAvatar :src="row.icon" size="2xs" />
      </template>
      <template #type-data="{ row }">
        <span>{{ typeToString(row.type) }}</span>
      </template>
      <template #actions-data="{ row }">
        <UButtonGroup>
          <UButton
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="del(row.id)"
            >Excluir</UButton
          >
          <UButton
            @click="edit(row.id, row.name, row.icon, row.type)"
            icon="i-heroicons-pencil-square"
            trailing
            >Alterar</UButton
          >
        </UButtonGroup>
      </template>
    </UTable>
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
          <h2>Adicionar Empresa</h2>
        </template>
        <UForm :validate="validate" :state="state" @submit.prevent="save">
          <UFormGroup label="Nome" name="name" class="mb-4">
            <UInput v-model="state.name" />
          </UFormGroup>
          <UFormGroup label="Ícone" name="icon" class="mb-4">
            <UInput v-model="state.icon" />
          </UFormGroup>
          <UFormGroup label="Tipo" name="type" class="mb-4">
            <USelectMenu v-model="selectedType" :options="types">
              <template #label>
                {{ selectedType.label }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <UInput v-model="state.id" type="hidden" />

          <div class="flex justify-evenly mt-4">
            <UButton variant="soft" @click="isOpen = false">Cancelar</UButton>
            <UButton type="submit">Salvar</UButton>
          </div>
        </UForm>
      </UCard>
    </USlideover>
  </div>
</template>
<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui/dist/runtime/types";
const toast = useToast();
const types = [
  {
    id: "PROGRAM",
    label: "Programa",
  },
  {
    id: "AIRLINE",
    label: "Cia Aérea",
  },
];
const selectedType = ref();
const state = ref({
  id: undefined,
  name: undefined,
  icon: undefined,
});

const validate = (state: any): FormError[] => {
  const errors = [];
  if (!state.name) errors.push({ path: "name", message: "Informe o nome" });
  // TODO verificar se type foi selecionado
  return errors;
};

function add() {
  state.value.id = undefined;
  state.value.name = undefined;
  state.value.icon = undefined;
  selectedType.value = types[0];
  isOpen.value = true;
}

function edit(id: any, name: any, icon: any, type: any) {
  state.value.id = id;
  state.value.name = name;
  state.value.icon = icon;
  selectedType.value = types.find((e) => e.id === type);
  isOpen.value = true;
}

async function save(event: FormSubmitEvent<any>) {
  const { data: result, error } = useFetch("/api/companies", {
    method: "POST",
    body: JSON.stringify({
      id: state.value.id,
      name: state.value.name,
      icon: state.value.icon,
      type: selectedType.value.id,
    }),
  });
  if (!error.value) {
    if (state.value.id) {
      toast.add({
        title: "Empresa atualizada com sucesso",
        icon: "i-heroicons-check-circle",
      });
    } else {
      toast.add({
        title: "Empresa cadastrada com sucesso",
        icon: "i-heroicons-check-circle",
      });
    }
    refresh();
    isOpen.value = false;
  } else {
    if (error.value?.statusCode == 422) {
      toast.add({
        title: "Empresa já está sendo usada",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    } else {
      toast.add({
        title: "Erro " + error.value.statusCode,
        description: error.value.statusMessage,
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

async function del(id: String) {
  if (confirm("Excluir Empresa?")) {
    const { data: result, error } = await useFetch("/api/companies", {
      method: "DELETE",
      body: JSON.stringify({
        id: id,
      }),
    });
    if (!error.value) {
      toast.add({
        title: "Empresa excluída com sucesso",
        icon: "i-heroicons-check-circle",
      });
      refresh();
    } else {
      toast.add({
        title: "Erro ao excluir Empresa",
        description: error.value.message + "(" + error.value.statusCode + ")",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

async function refresh() {
  await refreshNuxtData("companies");
}

const filter = ref("");
const isOpen = ref(false);
const columns = [
  {
    key: "id",
    label: "ID",
    sortable: true,
  },
  {
    key: "name",
    label: "Nome",
    sortable: true,
  },
  {
    key: "icon",
    label: "Ícone",
  },
  {
    key: "type",
    label: "Tipo",
  },
  {
    key: "actions",
  },
];
const { pending, data: companies } = await useLazyAsyncData("companies", () => {
  return $fetch("/api/companies");
});
const filteredCompanies = computed(() => {
  if (!filter.value) {
    return companies.value;
  }
  return companies.value.filter((company: ArrayLike<unknown>) => {
    return Object.values(company).some((value) => {
      return String(value).toLowerCase().includes(filter.value.toLowerCase());
    });
  });
});
</script>
