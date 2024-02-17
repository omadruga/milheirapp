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
        <h2>Adicionar Conta</h2>
      </template>
      <UForm :validate="validate" :state="state" @submit="save">
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
</template>
<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui/dist/runtime/types";
const toast = useToast();
defineExpose({ add, edit });
const emit = defineEmits(["refresh"]);
const isOpen = ref(false);
const form = ref();

const searchCpf = async (q: any) => {
  const cpfs = await $fetch("/api/cpfs", { params: { q } });
  return cpfs
    .map((cpf: { id: any; name: string; cpf: string }) => ({
      id: cpf.id,
      label: nameCpfToString(cpf.name, cpf.cpf),
    }))
    .filter(Boolean);
};
const selectedCpf = ref({ label: "Selecione...", id: 0 });
let filterOutCompanies = [];
const searchCompany = async (q: any) => {
  const companies = await $fetch("/api/companies", { params: { q } });
  return companies
    .map((company: { id: any; name: any; icon: any }) => ({
      id: company.id,
      label: company.name,
      icon: company.icon,
    }))
    .filter((obj) => !filterOutCompanies.includes(obj.id))
    .sort((a, b) => {
      if (a.label.toLowerCase() > b.label.toLowerCase()) return 1;
      else if (a.label.toLowerCase() < b.label.toLowerCase()) return -1;
      else return 0;
    });
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

function add(
  selectedCpfId: number,
  selectedCpfName: string,
  selectedCpfCpf: string,
  companies: number[]
) {
  state.value.id = undefined;
  state.value.miles = undefined;
  state.value.averageMilePrice = undefined;
  state.value.seats = undefined;
  state.value.seatsUsed = undefined;
  selectedCpf.value.id = selectedCpfId;
  selectedCpf.value.label = nameCpfToString(selectedCpfName, selectedCpfCpf);
  filterOutCompanies.length = 0;
  if (companies) {
    filterOutCompanies = companies.slice();
  }
  selectedCompany.value.id = 0;
  selectedCompany.value.label = "Selecione...";
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
    emit("refresh");
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
</script>
