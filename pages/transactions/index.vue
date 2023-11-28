<template>
  <div>
    <div class="flex gap-3 align-middle items-center">
      <CrudMyTitle title="Transações" />
      <UInput placeholder="Filtrar" v-model="filter" />
      <USelectMenu
        v-model="selectedAccountFilter"
        :searchable="searchAccount"
        searchable-placeholder="Pesquisar Conta"
        @change="refresh"
      >
        <template #label>
          {{ selectedAccountFilterLabel }}
        </template>
      </USelectMenu>
      <USelectMenu
        v-model="selectedTypeFilter"
        :options="types"
        @change="refresh"
      >
        <template #label>
          {{ selectedTypeFilter?.label ?? "Selecione..." }}
        </template>
      </USelectMenu>
      <UButtonGroup>
        <CrudRefreshButton @refresh="refresh" />
        <UButton
          to="/transactions/dump"
          icon="i-heroicons-document-arrow-down"
          variant="outline"
          trailing
          >Dump</UButton
        >
        <CrudAddButton @add="form?.add" />
      </UButtonGroup>
    </div>
    <UTable :rows="filteredTransactions" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhuma Transação cadastrada</span>
          <CrudAddButton @add="form?.add" />
        </div>
      </template>
      <template #cpf-data="{ row }">
        <span>{{ row.account?.cpf?.name }} ({{ row.account?.cpf?.cpf }})</span>
      </template>
      <template #company-data="{ row }">
        <div class="flex gap-1">
          <UAvatar :src="row.account?.company?.icon" size="2xs" />
          {{ row.account?.company.name }}
        </div>
      </template>
      <template #type-data="{ row }">
        <span>{{ transactionTypeToString(row.type) }}</span>
      </template>
      <template #date-data="{ row }">
        <span>{{ $dayjs(row.date).format("DD/MM/YYYY") }}</span>
      </template>
      <template #averagePrice-data="{ row }">
        <span>{{ row.averagePrice?.toFixed(2) }}</span>
      </template>
      <template #expire-data="{ row }">
        <span>{{
          row.expire
            ? $dayjs().to($dayjs(row.expire))
            : canExpire(row.type)
            ? "Nunca expira"
            : ""
        }}</span>
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
            @click="form?.edit(row)"
            icon="i-heroicons-pencil-square"
            trailing
            >Alterar</UButton
          >
        </UButtonGroup>
      </template>
    </UTable>
    <FormTransaction ref="form" @refresh="refresh" />
  </div>
</template>
<script setup lang="ts">
const toast = useToast();
const route = useRoute();
const form = ref();

const types = [
  {
    id: null,
    label: "Selecione...",
  },
  {
    id: "BUY",
    label: transactionTypeToString("BUY"),
  },
  {
    id: "MEMBERSHIP",
    label: transactionTypeToString("MEMBERSHIP"),
  },
  {
    id: "PARTNER",
    label: transactionTypeToString("PARTNER"),
  },
  {
    id: "TRANSFER",
    label: transactionTypeToString("TRANSFER"),
  },
  {
    id: "TRANSFER_BUY",
    label: transactionTypeToString("TRANSFER_BUY"),
  },
  {
    id: "FLIGHT",
    label: transactionTypeToString("FLIGHT"),
  },
  {
    id: "EXPIRE",
    label: transactionTypeToString("EXPIRE"),
  },
];

const selectedTypeFilter = ref();
const searchAccount = async (q: any) => {
  const accounts = await $fetch("/api/accounts", { params: { q } });
  return accounts
    .map(
      (account: {
        id: any;
        company: { name: string };
        cpf: { name: string; cpf: string };
      }) => ({
        id: account.id,
        label: accountToStr(account),
      })
    )
    .filter(Boolean)
    .sort((a: any, b: any) => {
      if (a.label.toLowerCase() > b.label.toLowerCase()) return 1;
      else if (a.label.toLowerCase() < b.label.toLowerCase()) return -1;
      else return 0;
    });
};
const selectedAccountFilter = ref({});
const selectedAccountFilterLabel = computed(() => {
  if (selectedAccountFilter.value.id) {
    return selectedAccountFilter.value.label;
  } else if (route.query.accountId) {
    return route.query.accountLabel;
  } else {
    return "Selecione...";
  }
});

async function del(id: String) {
  if (confirm("Excluir Transação?")) {
    const { data: result, error } = await useFetch("/api/transactions", {
      method: "DELETE",
      body: JSON.stringify({
        id: id,
      }),
    });
    if (!error.value) {
      toast.add({
        title: "Transação excluída com sucesso",
        icon: "i-heroicons-check-circle",
      });
      refresh();
    } else {
      toast.add({
        title: "Erro ao excluir Transação",
        description: error.value.message + "(" + error.value.statusCode + ")",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

async function refresh() {
  await refreshNuxtData("transactions");
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
    key: "type",
    label: "Transação",
    sortable: true,
  },
  {
    key: "date",
    label: "Data",
    sortable: true,
  },
  {
    key: "miles",
    label: "Milhas",
    sortable: true,
  },
  {
    key: "cost",
    label: "Custo",
    sortable: true,
  },
  {
    key: "averagePrice",
    label: "Preço Médio",
  },
  {
    key: "expire",
    label: "Validade",
  },
  {
    key: "actions",
  },
];

function canExpire(type: string): boolean {
  if (type == "FLIGHT" || type == "EXPIRE") return false;
  return true;
}

const { pending, data: transactions } = await useLazyAsyncData(
  "transactions",
  () => {
    let query = { type: null, account: null };
    if (selectedTypeFilter.value?.id) {
      query.type = selectedTypeFilter.value.id;
    }
    if (selectedAccountFilter.value?.id) {
      query.account = selectedAccountFilter.value.id;
    } else if (route.query.accountId) {
      query.account = route.query.accountId;
      selectedAccountFilter.value.id = route.query.accountId;
      selectedAccountFilter.value.label = route.query.accountLabel;
    }
    return $fetch("/api/transactions", { params: query });
  }
);
const filteredTransactions = computed(() => {
  if (!filter.value) {
    return transactions.value;
  }
  return transactions.value.filter((transaction: ArrayLike<unknown>) => {
    return Object.values(transaction).some((value) => {
      return String(value).toLowerCase().includes(filter.value.toLowerCase());
    });
  });
});
</script>
