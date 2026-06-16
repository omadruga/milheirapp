<template>
  <UCard
    :ui="{
      header: { padding: 'p-4 sm:p-4' },
      body: { padding: 'p-4 sm:p-4' },
    }"
  >
    <template #header>
      <h2 class="text-lg font-semibold">Simulação de venda</h2>
    </template>

    <UFormGroup label="Caminho" class="mb-3">
      <USelectMenu v-model="path" :options="paths">
        <template #label>{{ path.label }}</template>
      </USelectMenu>
    </UFormGroup>

    <div class="mb-4">
      <div class="text-sm font-medium mb-2">Por cia destino</div>
      <div class="space-y-2">
        <div
          v-for="a in airlines"
          :key="a.value"
          class="flex items-center gap-2"
        >
          <UAvatar v-if="a.icon" :src="a.icon" size="2xs" />
          <span class="w-16 text-sm">{{ a.label }}</span>
          <div class="flex-1">
            <UInput
              v-model.number="inputs[a.value].bonus"
              type="number"
              min="0"
              step="1"
              placeholder="Bônus %"
            >
              <template #trailing>
                <span class="text-xs text-gray-400">% bonus</span>
              </template>
            </UInput>
          </div>
          <div class="flex-1">
            <UInput
              v-model.number="inputs[a.value].sale"
              type="number"
              min="0"
              step="0.01"
              placeholder="Venda"
            >
              <template #trailing>
                <span class="text-xs text-gray-400">R$/1000</span>
              </template>
            </UInput>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="r in results"
        :key="r.cpf.id"
        class="border border-gray-200 dark:border-gray-700 rounded p-3"
      >
        <div class="font-semibold mb-2">{{ r.cpf.name }}</div>
        <div v-if="r.totalMiles === 0" class="text-sm text-gray-500">
          Sem milhas em programa.
        </div>
        <template v-else>
          <div class="text-sm mb-2 space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Milhas programa:</span>
              <span>{{ fmtMiles(r.totalMiles) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Custo médio:</span>
              <span>R$ {{ fmtMoney(r.avgPrice) }}/1000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Custo total:</span>
              <span>R$ {{ fmtMoney(r.cost) }}</span>
            </div>
          </div>
          <table class="w-full text-xs">
            <thead class="text-gray-500">
              <tr>
                <th class="text-left py-1">Cia</th>
                <th class="text-right py-1">Após bonus</th>
                <th class="text-right py-1">Venda</th>
                <th class="text-right py-1">Lucro</th>
                <th class="text-right py-1">Marg.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in r.byAirline"
                :key="row.airline"
                :class="[
                  'border-t border-gray-100 dark:border-gray-800',
                  row.best && 'bg-green-50 dark:bg-green-900/20 font-semibold',
                ]"
              >
                <td class="py-1">{{ row.airline }}</td>
                <td class="text-right">{{ fmtMiles(row.milesAfterBonus) }}</td>
                <td class="text-right">R$ {{ fmtMoney(row.saleValue) }}</td>
                <td
                  class="text-right"
                  :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  R$ {{ fmtMoney(row.profit) }}
                </td>
                <td
                  class="text-right"
                  :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ row.margin.toFixed(0) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <div
        v-if="totals.totalMiles > 0"
        class="border-2 border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-800"
      >
        <div class="font-semibold mb-2">Total combinado (todos CPFs)</div>
        <div class="text-sm mb-2 flex justify-between">
          <span class="text-gray-500">Milhas + Custo:</span>
          <span>{{ fmtMiles(totals.totalMiles) }} • R$ {{ fmtMoney(totals.cost) }}</span>
        </div>
        <table class="w-full text-xs">
          <thead class="text-gray-500">
            <tr>
              <th class="text-left py-1">Cia</th>
              <th class="text-right py-1">Após bonus</th>
              <th class="text-right py-1">Venda</th>
              <th class="text-right py-1">Lucro</th>
              <th class="text-right py-1">Marg.</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in totals.byAirline"
              :key="row.airline"
              :class="[
                'border-t border-gray-200 dark:border-gray-700',
                row.best && 'bg-green-100 dark:bg-green-900/30 font-semibold',
              ]"
            >
              <td class="py-1">{{ row.airline }}</td>
              <td class="text-right">{{ fmtMiles(row.milesAfterBonus) }}</td>
              <td class="text-right">R$ {{ fmtMoney(row.saleValue) }}</td>
              <td
                class="text-right"
                :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                R$ {{ fmtMoney(row.profit) }}
              </td>
              <td
                class="text-right"
                :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ row.margin.toFixed(0) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  cpfs: { type: Array, default: () => [] },
});

const paths = [
  { label: "Transferência bonificada simples", value: "TRANSFER_BONIFICADA" },
];
const path = ref(paths[0]);

const airlines = computed(() => {
  const seen = new Map();
  for (const cpf of props.cpfs ?? []) {
    for (const acc of cpf.accounts ?? []) {
      if (acc.company?.type === "AIRLINE" && !seen.has(acc.company.name)) {
        seen.set(acc.company.name, {
          label: acc.company.name,
          value: acc.company.name,
          icon: acc.company.icon,
        });
      }
    }
  }
  return Array.from(seen.values());
});

const inputs = reactive({});
watchEffect(() => {
  for (const a of airlines.value) {
    if (!inputs[a.value]) inputs[a.value] = { bonus: 0, sale: 0 };
  }
});

function computeByAirline(totalMiles, avgPrice) {
  const cost = (totalMiles * avgPrice) / 1000;
  const rows = airlines.value.map((a) => {
    const inp = inputs[a.value] ?? { bonus: 0, sale: 0 };
    const milesAfterBonus = totalMiles * (1 + (inp.bonus || 0) / 100);
    const saleValue = (milesAfterBonus * (inp.sale || 0)) / 1000;
    const profit = saleValue - cost;
    const margin = saleValue > 0 ? (profit / saleValue) * 100 : 0;
    return { airline: a.label, milesAfterBonus, saleValue, profit, margin };
  });
  const maxProfit = Math.max(...rows.map((r) => r.profit), 0);
  if (maxProfit > 0) {
    for (const r of rows) r.best = r.profit === maxProfit;
  }
  return rows;
}

const results = computed(() => {
  return (props.cpfs ?? []).map((cpf) => {
    const programs = (cpf.accounts ?? []).filter(
      (a) => a.company?.type === "PROGRAM"
    );
    const totalMiles = programs.reduce((s, a) => s + (a.miles ?? 0), 0);
    const totalCost = programs.reduce(
      (s, a) => s + (a.miles ?? 0) * (a.averageMilePrice ?? 0),
      0
    );
    const avgPrice = totalMiles > 0 ? totalCost / totalMiles : 0;
    const cost = (totalMiles * avgPrice) / 1000;
    const byAirline = computeByAirline(totalMiles, avgPrice);
    return { cpf, totalMiles, avgPrice, cost, byAirline };
  });
});

const totals = computed(() => {
  const totalMiles = results.value.reduce((s, r) => s + r.totalMiles, 0);
  const cost = results.value.reduce((s, r) => s + r.cost, 0);
  const avgPrice = totalMiles > 0 ? (cost / totalMiles) * 1000 : 0;
  const byAirline = computeByAirline(totalMiles, avgPrice);
  return { totalMiles, avgPrice, cost, byAirline };
});

function fmtMiles(n) {
  return Math.round(n).toLocaleString("pt-BR");
}
function fmtMoney(n) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>
