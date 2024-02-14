<template>
  <UAccordion
    :items="cpfs"
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

  <FormCpf ref="formCpf" @refresh="refresh" />
  <FormAccount ref="formAccount" @refresh="refresh" />
  <FormTransaction ref="formTransaction" @refresh="refresh" />
</template>
<script setup>
const { loggedIn, user, session, clear } = useUserSession();
const { pending, data: cpfs } = await useLazyAsyncData("cpfs", () => {
  return $fetch("/api/");
});
const formCpf = ref();
const formAccount = ref();
const formTransaction = ref();
async function refresh() {
  await refreshNuxtData("cpfs");
}
</script>
