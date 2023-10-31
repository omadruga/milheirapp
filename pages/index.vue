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
                {{ account.miles }} Pontos ao Médio de R$
                {{ account.averageMilePrice?.toFixed(2) }}
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
                {{ account.miles }} Milhas ao Médio de R$
                {{ account.averageMilePrice.toFixed(2) }} CPFs:
                {{ account.seatsUsed }} /
                {{ account.seats }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UAccordion>
</template>
<script setup>
const cpfs = await $fetch("/api/");
</script>
