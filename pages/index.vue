<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2">
      <UAccordion
        :items="cpfs ?? []"
        multiple
        default-open
        :ui="{ item: { padding: 'pt-0 pb-3' } }"
      >
        <template #default="{ item, index, open }">
          <UButton
            variant="soft"
            class="rounded-none rounded-t-lg"
            :ui="{ padding: { sm: 'p-3' } }"
          >
            <span class="truncate">{{ item.name }} ({{ item.cpf }})</span>
            <template #trailing>
              <UIcon
                name="i-heroicons-chevron-right-20-solid"
                class="w-5 h-5 ms-auto transform transition-transform duration-200"
                :class="[open && 'rotate-90']"
              />
            </template>
          </UButton>
        </template>
        <template #item="{ item }">
          <div class="border-x border-b border-cyan-900 rounded-none px-4 pt-4">
            <div class="flex">
              <div class="flex-1">
                <div v-for="account in item.accounts">
                  <div
                    v-if="account.company.type == 'PROGRAM'"
                    class="flex gap-2 items-center pb-4 text-lg"
                  >
                    <UAvatar :src="account.company.icon" size="sm" />
                    <ULink
                      :to="`/transactions?accountId=${
                        account.id
                      }&accountLabel=${accountToStr({
                        company: { name: account.company.name },
                        cpf: { name: item.name, cpf: item.cpf },
                      })}`"
                    >
                      {{ account.miles?.toLocaleString() }} a R$
                      {{
                        account.averageMilePrice?.toLocaleString(undefined, {
                          currency: "BRL",
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })
                      }}
                    </ULink>

                    <CrudAddButton
                      v-if="loggedIn"
                      @add="
                        formTransaction?.add(
                          account.id,
                          accountToStr({
                            company: { name: account.company.name },
                            cpf: { name: item.name, cpf: item.cpf },
                          })
                        )
                      "
                      title=""
                    />
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <div v-for="account in item.accounts">
                  <div
                    v-if="account.company.type == 'AIRLINE'"
                    class="flex gap-2 items-center pb-4 text-xl"
                  >
                    <UAvatar :src="account.company.icon" size="sm" />
                    <ULink
                      :to="`/transactions?accountId=${
                        account.id
                      }&accountLabel=${accountToStr({
                        company: { name: account.company.name },
                        cpf: { name: item.name, cpf: item.cpf },
                      })}`"
                    >
                      {{ account.miles?.toLocaleString() }} a R$
                      {{
                        account.averageMilePrice?.toLocaleString(undefined, {
                          currency: "BRL",
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })
                      }}
                      CPFs: {{ account.seatsUsed }} /
                      {{ account.seats }}
                    </ULink>
                    <CrudAddButton
                      v-if="loggedIn"
                      @add="
                        formTransaction?.add(
                          item.id,
                          item.name,
                          item.cpf,
                          item.accounts.map((obj) => obj.companyId)
                        )
                      "
                      title=""
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-center justify-center py-6 gap-3">
              <CrudAddButton
                v-if="loggedIn"
                @add="
                  formAccount?.add(
                    item.id,
                    item.name,
                    item.cpf,
                    item.accounts.map((obj) => obj.companyId)
                  )
                "
                title="Cadastrar Conta"
              />
            </div>
          </div>
        </template>
      </UAccordion>
      <div class="flex flex-col items-center justify-center py-6 gap-3">
        <CrudAddButton v-if="loggedIn" @add="formCpf?.add" title="Cadastrar CPF" />
      </div>
    </div>

    <div class="lg:col-span-1">
      <UCard class="mb-4">
        <template #header>
          <h3 class="font-semibold">Ganho com Vendas</h3>
        </template>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs text-gray-500">Recebido</div>
            <div class="text-lg font-semibold text-green-600">
              {{ brl(sales.recebido) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Lucro</div>
            <div class="text-lg font-semibold text-green-600">
              {{ brl(sales.lucro) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">A receber</div>
            <div class="text-lg font-semibold text-amber-500">
              {{ brl(sales.aReceber) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Previsto total</div>
            <div class="text-lg font-semibold">{{ brl(sales.previsto) }}</div>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-3">
          {{ sales.count }} vendas · custo das milhas {{ brl(sales.custo) }}
        </div>
      </UCard>
      <SimulatorPanel :cpfs="cpfs ?? []" />
    </div>
  </div>

  <FormCpf ref="formCpf" @refresh="refresh" />
  <FormAccount ref="formAccount" @refresh="refresh" />
  <FormTransaction ref="formTransaction" @refresh="refresh" />
</template>
<script setup>
const { loggedIn, user, session, clear } = useUserSession();
const { pending, data: cpfs } = await useFetch("/api/", { key: "cpfs", lazy: true });
const formCpf = ref();
const formAccount = ref();
const formTransaction = ref();

function brl(v) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const sales = computed(() => {
  const s = { recebido: 0, previsto: 0, aReceber: 0, custo: 0, lucro: 0, count: 0 };
  for (const cpf of cpfs.value ?? []) {
    for (const account of cpf.accounts ?? []) {
      for (const t of account.transactions ?? []) {
        if (t.type !== "SALE") continue;
        s.count++;
        s.previsto += t.previsto ?? 0;
        s.recebido += t.received ?? 0;
        if (t.saleStatus === "PENDING")
          s.aReceber += (t.previsto ?? 0) - (t.received ?? 0);
        if (t.saleStatus === "PAID") {
          s.custo += t.costBasis ?? 0;
          s.lucro += (t.received ?? 0) - (t.costBasis ?? 0);
        }
      }
    }
  }
  return s;
});

async function refresh() {
  await refreshNuxtData("cpfs");
}
</script>
