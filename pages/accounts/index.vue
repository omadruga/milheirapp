<template>
  <div>
    <CrudHeader
      title="Contas Administradas"
      v-model="filter"
      @add="add"
      @refresh="refresh"
    />
    <UTable :rows="filteredAccounts" :columns="columns" :loading="pending">
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6 gap-3">
          <span class="text-sm">Nenhuma Conta cadastrada</span>
          <CrudAddButton @click="add" />
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
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="del(row.id)"
            >Excluir</UButton
          >
          <UButton
            @click="
              edit(
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
          <h2>Adicionar Conta</h2>
        </template>
        <UForm :validate="validate" :state="state" @submit.prevent="save">
          <UFormGroup label="CPF" name="cpf" class="mb-4">
            <USelectMenu
              v-model="selectedCpf"
              :searchable="searchCpf"
              searchable-placeholder="Pesquisar CPF"
            >
              <template #label>
                {{ selectedCpf.label }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <UFormGroup label="Empresa" name="company" class="mb-4">
            <USelectMenu
              v-model="selectedCompany"
              :searchable="searchCompany"
              searchable-placeholder="Pesquisar Empresa"
            >
              <template #label>
                {{ selectedCompany.label }}
              </template>
            </USelectMenu>
          </UFormGroup>
          <UFormGroup label="Milhas" name="miles" class="mb-4">
            <UInput v-model="state.miles" />
          </UFormGroup>
          <UFormGroup label="Preço Médio" name="averageMilePrice" class="mb-4">
            <UInput v-model="state.averageMilePrice" />
          </UFormGroup>
          <UFormGroup label="Qtde CPFs Permitidos" name="seats" class="mb-4">
            <UInput v-model="state.seats" />
          </UFormGroup>
          <UFormGroup label="Qtde CPFs Usados" name="seatsUsed" class="mb-4">
            <UInput v-model="state.seatsUsed" />
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
const searchCpf = async (q: any) => {
  const cpfs = await $fetch("/api/cpfs", { params: { q } });
  return cpfs
    .map((cpf: { id: any; name: string; cpf: string }) => ({
      id: cpf.id,
      label: cpf.name + " (" + cpf.cpf + ")",
    }))
    .filter(Boolean);
};
const selectedCpf = ref({ label: "Selecione...", id: 0 });
const searchCompany = async (q: any) => {
  const companies = await $fetch("/api/companies", { params: { q } });
  return companies
    .map((company: { id: any; name: any; icon: any }) => ({
      id: company.id,
      label: company.name,
      icon: company.icon,
    }))
    .filter(Boolean);
};
const selectedCompany = ref({ label: "Selecione...", id: 0 });
const state = ref({
  id: undefined,
  miles: undefined,
  averageMilePrice: undefined,
  seats: undefined,
  seatsUsed: undefined,
});

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];
  if (!selectedCpf?.value?.id)
    errors.push({ path: "cpf", message: "Selecione um CPF" });
  if (!selectedCompany?.value?.id)
    errors.push({ path: "company", message: "Selecione uma Empresa" });
  return errors;
};

function add() {
  state.value.id = undefined;
  state.value.miles = undefined;
  state.value.averageMilePrice = undefined;
  state.value.seats = undefined;
  state.value.seatsUsed = undefined;
  isOpen.value = true;
}

function edit(
  id: any,
  cpf: any,
  company: any,
  miles: any,
  averageMilePrice: any,
  seats: any,
  seatsUsed: any
) {
  state.value.id = id;
  selectedCpf.value.id = cpf;
  selectedCompany.value.id = company;
  state.value.miles = miles;
  state.value.averageMilePrice = averageMilePrice;
  state.value.seats = seats;
  state.value.seatsUsed = seatsUsed;
  isOpen.value = true;
}

async function save(event: FormSubmitEvent<any>) {
  const { data: result, error } = useFetch("/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      id: state.value.id,
      cpf: selectedCpf.value.id,
      company: selectedCompany.value.id,
      miles: state.value.miles,
      averageMilePrice: state.value.averageMilePrice,
      seats: state.value.seats,
      seatsUsed: state.value.seatsUsed,
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
    if (error.value?.statusCode == 422) {
      toast.add({
        title: "Já existe essa Empresa cadastrada nesse CPF",
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    } else {
      toast.add({
        title: error.value.message,
        description: error.value.statusMessage,
        icon: "i-heroicons-x-circle",
        color: "red",
      });
    }
  }
}

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
