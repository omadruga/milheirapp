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
          {{ selectedAccountFilter?.label ?? "Selecione..." }}
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
        <CrudAddButton @add="add" />
      </UButtonGroup>
    </div>
    <UTable :rows="filteredTransactions" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhuma Transação cadastrada</span>
          <CrudAddButton @click="add" />
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
          row.expire ? $dayjs().to($dayjs(row.expire)) : "Nunca expira"
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
          <UButton @click="edit(row)" icon="i-heroicons-pencil-square" trailing
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
          <h2>Adicionar Transação</h2>
        </template>
        <UForm :validate="validate" :state="state" @submit.prevent="save">
          <UFormGroup label="Tipo de Transação" name="type" class="mb-4">
            <USelectMenu v-model="selectedType" :options="types">
              <template #label>
                {{ selectedType?.label ?? "Selecione..." }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <UFormGroup :label="accountLabel" name="account" class="mb-4">
            <USelectMenu
              v-model="selectedAccount"
              :searchable="searchAccount"
              searchable-placeholder="Pesquisar Conta"
            >
              <template #label>
                {{ selectedAccount?.label ?? "Selecione..." }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <UFormGroup
            v-if="showAccountTo"
            label="Conta Destino"
            name="accountTo"
            class="mb-4"
          >
            <USelectMenu
              v-model="selectedAccountTo"
              :searchable="searchAccount"
              searchable-placeholder="Pesquisar Conta"
            >
              <template #label>
                {{ selectedAccountTo?.label ?? "Selecione..." }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <div class="flex">
            <UFormGroup label="Data" name="date" class="mb-4 flex-1">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  icon="i-heroicons-calendar-days-20-solid"
                  :label="$dayjs(state.date).format('DD/MM/YYYY')"
                />
                <template #panel="{ close }">
                  <DatePicker v-model="state.date" @close="close" />
                </template>
              </UPopover>
            </UFormGroup>
            <UFormGroup
              v-if="showExpire"
              label="Validade"
              name="expire"
              class="mb-4 flex-1"
            >
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  icon="i-heroicons-calendar-days-20-solid"
                  :label="
                    state.expire
                      ? $dayjs(state.expire).format('DD/MM/YYYY')
                      : 'Nunca expira'
                  "
                />
                <template #panel="{ close }">
                  <DatePicker v-model="state.expire" @close="close" />
                </template>
              </UPopover>
            </UFormGroup>
          </div>
          <div class="flex">
            <UFormGroup :label="milesLabel" name="miles" class="mb-4 flex-1">
              <UInput v-model="state.miles" />
            </UFormGroup>
            <UFormGroup
              v-if="showMilesTo"
              label="Milhas Destino"
              name="milesTo"
              class="mb-4 flex-1"
            >
              <UInput v-model="state.milesTo" />
            </UFormGroup>
            <UFormGroup
              v-if="showCost"
              label="Custo"
              name="cost"
              class="mb-4 flex-1"
            >
              <UInput v-model="state.cost" />
            </UFormGroup>
            <UFormGroup
              v-if="showCpfs"
              label="CPFs"
              name="cpfs"
              class="mb-4 flex-1"
            >
              <UInput v-model="state.cpfs" />
            </UFormGroup>
          </div>
          <div v-if="showMilesBuy" class="flex">
            <UFormGroup
              label="Milhas Compradas"
              name="milesBuy"
              class="mb-4 flex-1"
            >
              <UInput v-model="state.milesBuy" />
            </UFormGroup>
            <UFormGroup label="Custo" name="cost" class="mb-4 flex-1">
              <UInput v-model="state.cost" />
            </UFormGroup>
          </div>

          <UFormGroup label="Observação" name="description" class="mb-4">
            <UInput v-model="state.description" />
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

const selectedType = ref();
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
    .filter(Boolean);
};
const selectedAccount = ref(types[0]);
const selectedAccountTo = ref(types[0]);
const selectedAccountFilter = ref(types[0]);
const state = ref({
  id: undefined,
  date: undefined,
  miles: undefined,
  milesTo: undefined,
  cost: undefined,
  expire: undefined,
  description: undefined,
  cpfs: undefined,
  milesBuy: undefined,
});
const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];
  if (!selectedAccount?.value?.id)
    errors.push({ path: "account", message: "Selecione uma Conta" });
  if (!selectedType?.value?.id)
    errors.push({ path: "type", message: "Selecione um Tipo de Transação" });
  if (!state.date)
    errors.push({ path: "date", message: "Informe a Data da Transação" });
  if (!state.miles)
    errors.push({ path: "miles", message: "Informe a quantidade de Milhas" });
  if (showCost.value && !state.cost)
    errors.push({ path: "cost", message: "Informe o Custo" });
  if (showMilesTo.value && !state.milesTo)
    errors.push({
      path: "milesTo",
      message: "Informe a qtde de Milhas na conta Destino",
    });
  if (showMilesBuy.value) {
    if (!state.milesTo)
      errors.push({
        path: "milesTo",
        message: "Informe a quatidade de Milhas no Destino (com bônus)",
      });
    if (!state.milesBuy)
      errors.push({
        path: "milesBuy",
        message: "Informe a quatidade de Milhas compradas (sem bônus)",
      });
    if (!state.cost) errors.push({ path: "cost", message: "Informe o custo" });
  }
  return errors;
};
const showCost = computed(() => {
  return (
    selectedType.value?.id == "BUY" || selectedType.value?.id == "MEMBERSHIP"
  );
});
const accountLabel = computed(() => {
  return selectedType.value?.id == "TRANSFER" ||
    selectedType.value?.id == "TRANSFER_BUY"
    ? "Conta Origem"
    : "Conta";
});
const showAccountTo = computed(() => {
  return (
    selectedType.value?.id == "TRANSFER" ||
    selectedType.value?.id == "TRANSFER_BUY"
  );
});
const milesLabel = computed(() => {
  return selectedType.value?.id == "TRANSFER" ||
    selectedType.value?.id == "TRANSFER_BUY"
    ? "Milhas Origem"
    : "Milhas";
});
const showMilesTo = computed(() => {
  return (
    selectedType.value?.id == "TRANSFER" ||
    selectedType.value?.id == "TRANSFER_BUY"
  );
});
const showExpire = computed(() => {
  return (
    selectedType.value?.id == "BUY" ||
    selectedType.value?.id == "MEMBERSHIP" ||
    selectedType.value?.id == "PARTNER" ||
    selectedType.value?.id == "TRANSFER" ||
    selectedType.value?.id == "TRANSFER_BUY"
  );
});
const showCpfs = computed(() => {
  return selectedType.value?.id == "FLIGHT";
});
const showMilesBuy = computed(() => {
  return selectedType.value?.id == "TRANSFER_BUY";
});

function add() {
  state.value.id = undefined;
  selectedType.value = types[0];
  selectedAccount.value = { label: "Selecione...", id: 0 };
  selectedAccountTo.value = { label: "Selecione...", id: 0 };
  state.value.date = new Date();
  state.value.miles = undefined;
  state.value.milesTo = undefined;
  state.value.cost = undefined;
  state.value.expire = undefined;
  state.value.description = undefined;
  state.value.cpfs = undefined;
  state.value.milesBuy = undefined;
  isOpen.value = true;
}

function edit(row: any) {
  state.value.id = row.id;
  selectedType.value = types.find((e) => e.id === row.type);
  selectedAccount.value.id = row.account.id;
  selectedAccount.value.label = accountToStr(row.account) ?? "Selecione...";
  selectedAccountTo.value.id = row.accountTo?.id ?? null;
  selectedAccountTo.value.label = accountToStr(row.accountTo) ?? "Selecione...";
  state.value.date = row.date;
  state.value.miles = row.miles;
  state.value.milesTo = row.milesTo;
  state.value.cost = row.cost;
  state.value.expire = row.expire;
  state.value.description = row.description;
  state.value.cpfs = row.cpfs;
  state.value.milesBuy = row.milesBuy;
  isOpen.value = true;
}

async function save(event: FormSubmitEvent<any>) {
  const { data: result, error } = useFetch("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      id: state.value.id,
      type: selectedType.value.id,
      account: selectedAccount.value.id,
      accountTo: selectedAccountTo.value?.id,
      date: state.value.date,
      miles: state.value.miles,
      milesTo: state.value?.milesTo,
      cost: state.value.cost,
      expire: state.value.expire,
      description: state.value.description,
      cpfs: state.value.cpfs,
      milesBuy: state.value.milesBuy,
    }),
  });

  if (!error.value) {
    if (state.value.id) {
      toast.add({
        title: "Conta atualizada com sucesso",
        icon: "i-heroicons-check-circle",
      });
    } else {
      toast.add({
        title: "Conta cadastrada com sucesso",
        icon: "i-heroicons-check-circle",
      });
    }
    refresh();
    isOpen.value = false;
  } else {
    toast.add({
      title: error.value.message,
      description: error.value.statusMessage,
      icon: "i-heroicons-x-circle",
      color: "red",
    });
  }
}

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
const isOpen = ref(false);
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
const { pending, data: transactions } = await useLazyAsyncData(
  "transactions",
  () => {
    var query = {};
    if (selectedTypeFilter.value?.id) {
      query.type = selectedTypeFilter.value.id;
    }
    if (selectedAccountFilter.value?.id) {
      query.account = selectedAccountFilter.value.id;
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

function accountToStr(account: any) {
  if (!account) {
    return null;
  }
  return (
    account.company.name +
    " - " +
    account.cpf.name +
    " (" +
    account.cpf.cpf +
    ")"
  );
}
</script>
