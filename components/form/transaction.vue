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
        <h2>Adicionar Transação</h2>
      </template>
      <UForm :validate="validate" :state="state" @submit="save">
        <UFormGroup :label="accountLabel" name="account" class="mb-4">
          <USelectMenu
            v-model="selectedAccount"
            :searchable="searchAccount"
            searchable-placeholder="Pesquisar Conta"
          >
            <template #label>
              {{ selectedAccount.label }}
            </template>
          </USelectMenu>
        </UFormGroup>
        <UFormGroup label="Tipo de Transação" name="type" class="mb-4">
          <USelectMenu v-model="selectedType" :options="types">
            <template #label>
              {{ selectedType?.label ?? "Selecione..." }}
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
              {{ selectedAccountTo.label }}
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

        <div v-if="isSale">
          <UFormGroup label="Programa de Venda" name="saleProgram" class="mb-4">
            <USelectMenu
              v-model="selectedSaleProgram"
              :options="salePrograms"
            >
              <template #label>
                {{ selectedSaleProgram?.label ?? "Selecione..." }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <div class="flex">
            <UFormGroup label="Previsto (R$)" name="previsto" class="mb-4 flex-1">
              <UInput v-model="state.previsto" />
            </UFormGroup>
            <UFormGroup label="Recebido (R$)" name="received" class="mb-4 flex-1">
              <UInput v-model="state.received" />
            </UFormGroup>
            <UFormGroup label="Status" name="saleStatus" class="mb-4 flex-1">
              <USelectMenu
                v-model="selectedSaleStatus"
                :options="saleStatuses"
              >
                <template #label>
                  {{ selectedSaleStatus?.label }}
                </template>
              </USelectMenu>
            </UFormGroup>
          </div>
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
</template>
<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui/dist/runtime/types";
const toast = useToast();
defineExpose({ add, edit });
const emit = defineEmits(["refresh"]);
const isOpen = ref(false);
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
  {
    id: "SALE",
    label: transactionTypeToString("SALE"),
  },
];

const saleStatuses = [
  { id: "PAID", label: "Recebido" },
  { id: "PENDING", label: "A receber" },
  { id: "CANCELLED", label: "Cancelado" },
];

const selectedType = ref();
const selectedSaleProgram = ref({});
const selectedSaleStatus = ref(saleStatuses[0]);
const salePrograms = ref<any[]>([]);
async function loadSalePrograms() {
  if (salePrograms.value.length) return;
  const companies = await $fetch("/api/companies");
  salePrograms.value = (companies as any[])
    .filter((c) => c.type === "SALE")
    .map((c) => ({ id: c.id, label: c.name }));
}
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
    .sort((a, b) => {
      if (a.label.toLowerCase() > b.label.toLowerCase()) return 1;
      else if (a.label.toLowerCase() < b.label.toLowerCase()) return -1;
      else return 0;
    });
};
const selectedAccount = ref({});
const selectedAccountTo = ref({});
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
  previsto: undefined,
  received: undefined,
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
  if (isSale.value && !selectedSaleProgram?.value?.id)
    errors.push({ path: "saleProgram", message: "Selecione o Programa de Venda" });
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
  if (selectedType.value?.id == "SALE") return "Milhas Vendidas";
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
const isSale = computed(() => {
  return selectedType.value?.id == "SALE";
});

function add(accountId: number, accountLabel: string) {
  state.value.id = undefined;
  selectedType.value = types[0];
  if (accountId) {
    selectedAccount.value = { label: accountLabel, id: accountId };
    selectedAccountTo.value = { label: accountLabel, id: accountId };
  } else {
    selectedAccount.value = { label: "Selecione...", id: 0 };
    selectedAccountTo.value = { label: "Selecione...", id: 0 };
  }
  state.value.date = new Date();
  state.value.miles = undefined;
  state.value.milesTo = undefined;
  state.value.cost = undefined;
  state.value.expire = undefined;
  state.value.description = undefined;
  state.value.cpfs = undefined;
  state.value.milesBuy = undefined;
  state.value.previsto = undefined;
  state.value.received = undefined;
  selectedSaleProgram.value = {};
  selectedSaleStatus.value = saleStatuses[0];
  loadSalePrograms();
  isOpen.value = true;
}

function edit(row: any) {
  state.value.id = row.id;
  selectedType.value = types.find((e) => e.id === row.type);
  selectedAccount.value = {
    id: row.account.id,
    label: accountToStr(row.account),
  };
  selectedAccountTo.value = {
    id: row.accountTo?.id,
    label: accountToStr(row.accountTo),
  };
  state.value.date = row.date;
  state.value.miles = row.miles;
  state.value.milesTo = row.milesTo;
  state.value.cost = row.cost;
  state.value.expire = row.expire;
  state.value.description = row.description;
  state.value.cpfs = row.cpfs;
  state.value.milesBuy = row.milesBuy;
  state.value.previsto = row.previsto;
  state.value.received = row.received;
  selectedSaleProgram.value = row.saleProgram
    ? { id: row.saleProgram.id, label: row.saleProgram.name }
    : {};
  selectedSaleStatus.value =
    saleStatuses.find((s) => s.id === row.saleStatus) ?? saleStatuses[0];
  loadSalePrograms();
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
      saleProgram: selectedSaleProgram.value?.id,
      previsto: state.value.previsto,
      received: state.value.received,
      saleStatus: selectedSaleStatus.value?.id,
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
    emit("refresh");
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
</script>
