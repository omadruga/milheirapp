<template>
  <div>
    <CrudHeader
      title="CPFs Administrados"
      v-model="filter"
      @add="form?.add"
      @refresh="refresh"
    />
    <UTable :rows="filteredCpfs" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhum CPF cadastrado</span>
          <CrudAddButton @add="form?.add" />
        </div>
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
            @click="form?.edit(row.id, row.name, row.cpf)"
            icon="i-heroicons-pencil-square"
            trailing
            >Alterar</UButton
          >
        </UButtonGroup>
      </template>
    </UTable>
    <FormCpf ref="form" @refresh="refresh" />
  </div>
</template>
<script setup lang="ts">
const toast = useToast();
const form = ref();

async function del(id: String) {
  if (confirm("Excluir CPF?")) {
    const { data: result, error } = await useFetch("/api/cpfs", {
      method: "DELETE",
      body: JSON.stringify({
        id: id,
      }),
    });
    if (!error.value) {
      toast.add({
        title: "CPF excluído com sucesso",
        icon: "i-heroicons-check-circle",
      });
      refresh();
    } else {
      toast.add({
        title: "Erro ao excluir CPF.",
        description: error.value.message + "(" + error.value.statusCode + ")",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

async function refresh() {
  await refreshNuxtData("cpfs");
}

const filter = ref("");
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
    key: "cpf",
    label: "CPF",
    sortable: true,
  },
  {
    key: "actions",
  },
];
const { pending, data: cpfs } = await useLazyAsyncData("cpfs", () => {
  return $fetch("/api/cpfs");
});
const filteredCpfs = computed(() => {
  if (!filter.value) {
    return cpfs.value;
  }
  return cpfs.value.filter((cpf: ArrayLike<unknown>) => {
    return Object.values(cpf).some((value) => {
      return String(value).toLowerCase().includes(filter.value.toLowerCase());
    });
  });
});
</script>
