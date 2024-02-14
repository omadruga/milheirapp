<template>
  <div>
    <CrudHeader
      title="Contas Administradas"
      v-model="filter"
      @add="form?.add"
      @refresh="refresh"
    />
    <UTable :rows="filteredAccounts" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhuma Conta cadastrada</span>
          <CrudAddButton @click="form?.add" />
        </div>
      </template>
      <template #cpf-data="{ row }">
        <span>{{ row.cpf.name }} ({{ row.cpf.cpf }})</span>
      </template>
      <template #company-data="{ row }">
        <div class="flex gap-1">
          <UAvatar :src="row.company.icon" size="2xs" />
          {{ row.company.name }}
        </div>
      </template>
      <template #actions-data="{ row }">
        <UButtonGroup>
          <UButton
            v-if="loggedIn"
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="del(row.id)"
            >Excluir</UButton
          >
          <UButton
            v-if="loggedIn"
            @click="
              form?.edit(
                row.id,
                row.cpf,
                row.company,
                row.miles,
                row.averageMilePrice,
                row.seats,
                row.seatsUsed
              )
            "
            icon="i-heroicons-pencil-square"
            trailing
            >Alterar</UButton
          >
        </UButtonGroup>
      </template>
    </UTable>
    <FormAccount v-if="loggedIn" ref="form" @refresh="refresh" />
  </div>
</template>
<script setup lang="ts">
const { loggedIn, user, session, clear } = useUserSession();
const toast = useToast();
const form = ref();

async function del(id: String) {
  if (confirm("Excluir Conta?")) {
    const { data: result, error } = await useFetch("/api/accounts", {
      method: "DELETE",
      body: JSON.stringify({
        id: id,
      }),
    });
    if (!error.value) {
      toast.add({
        title: "Conta excluída com sucesso",
        icon: "i-heroicons-check-circle",
      });
      refresh();
    } else {
      toast.add({
        title: "Erro ao excluir Conta.",
        description: error.value.message + "(" + error.value.statusCode + ")",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

async function refresh() {
  await refreshNuxtData("accounts");
}

const filter = ref("");
const columns = [
  {
    key: "id",
    label: "ID",
    sortable: true,
  },
  {
    key: "cpf",
    label: "CPF",
    sortable: true,
  },
  {
    key: "company",
    label: "Empresa",
    sortable: true,
  },
  {
    key: "miles",
    label: "Milhas",
    sortable: true,
  },
  {
    key: "averageMilePrice",
    label: "Preço Médio",
    sortable: true,
  },
  {
    key: "seats",
    label: "CPFs Empresa",
  },
  {
    key: "seatsUsed",
    label: "CPFs Usados",
    sortable: true,
  },
  {
    key: "actions",
  },
];
const { pending, data: accounts } = await useLazyAsyncData("accounts", () => {
  return $fetch("/api/accounts");
});
const filteredAccounts = computed(() => {
  if (!filter.value) {
    return accounts.value;
  }
  return accounts.value.filter((cpf: ArrayLike<unknown>) => {
    return Object.values(cpf).some((value) => {
      return String(value).toLowerCase().includes(filter.value.toLowerCase());
    });
  });
});
</script>
