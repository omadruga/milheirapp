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

    <div v-if="isCarrinho" class="mb-4 border border-gray-200 dark:border-gray-700 rounded p-3">
      <div class="text-sm font-medium mb-2">Compra no carrinho</div>
      <div class="flex gap-2 mb-2">
        <UFormGroup label="Meta (milhas)" class="flex-1">
          <UInput v-model.number="buy.target" type="number" min="0" step="1000" />
        </UFormGroup>
        <UFormGroup label="Preço (R$/1000)" class="flex-1">
          <UInput v-model.number="buy.pricek" type="number" min="0" step="0.01" />
        </UFormGroup>
      </div>
      <UCheckbox v-model="buy.pix" label="PIX 5% off" />
      <div v-if="buy.pricek > 0" class="text-xs text-gray-500 mt-2">
        Preço efetivo da compra: R$ {{ fmtMoney(effectiveBuyPricek) }} / 1000 milhas
      </div>
    </div>

    <div class="mb-4">
      <div class="text-sm font-medium mb-2">Por cia destino</div>
      <div class="space-y-2">
        <div
          v-for="a in airlines"
          :key="a.value"
          class="flex items-center gap-2"
        >
          <UAvatar v-if="a.icon" :src="a.icon" size="2xs" />
          <span class="w-12 text-sm">{{ a.label }}</span>
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
          {{ isCarrinho ? "Defina uma meta de transferência." : "Sem milhas em programa." }}
        </div>
        <template v-else>
          <div class="text-sm mb-2 space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Milhas programa:</span>
              <span>{{ fmtMiles(r.existingMiles) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Disponível (múltiplos de 1.000):</span>
              <span>{{ fmtMiles(r.availableFloored) }}</span>
            </div>
            <div v-if="r.floorLeftover > 0" class="flex justify-between text-xs text-amber-600">
              <span>Sobra fixa (floor):</span>
              <span>{{ fmtMiles(r.floorLeftover) }}</span>
            </div>
            <template v-if="isCarrinho">
              <div class="flex justify-between mt-1">
                <span class="text-gray-500">Meta:</span>
                <span>{{ fmtMiles(r.target) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">→ Usar existente:</span>
                <span>{{ fmtMiles(r.useExisting) }} (R$ {{ fmtMoney(r.useExistingCost) }})</span>
              </div>
              <div v-if="r.buyMiles > 0" class="flex justify-between">
                <span class="text-gray-500">→ Comprar:</span>
                <span>{{ fmtMiles(r.buyMiles) }} (R$ {{ fmtMoney(r.buyCost) }})</span>
              </div>
              <div v-else-if="r.target > 0 && r.target < r.availableFloored" class="flex justify-between text-xs text-gray-400">
                <span>(meta menor que disponível — carrinho não usado)</span>
              </div>
            </template>
            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
              <span class="text-gray-500">Transferível p/ cia:</span>
              <span>{{ fmtMiles(r.totalMiles) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Custo médio efetivo:</span>
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
                <th class="text-right py-1">Vendável</th>
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
                <td class="text-right">{{ fmtMiles(row.sellable) }}</td>
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
        <div class="text-sm mb-2 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500">Transferível:</span>
            <span>{{ fmtMiles(totals.totalMiles) }}</span>
          </div>
          <div v-if="totals.leftover > 0" class="flex justify-between text-xs text-amber-600">
            <span>Sobra:</span>
            <span>{{ fmtMiles(totals.leftover) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Custo total:</span>
            <span>R$ {{ fmtMoney(totals.cost) }}</span>
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
  { label: "Transferência bonificada simples", value: "SIMPLE" },
  { label: "Transferência compra carrinho", value: "CARRINHO" },
];
const path = ref(paths[0]);
const isCarrinho = computed(() => path.value.value === "CARRINHO");

const buy = reactive({ target: 0, pricek: 0, pix: false });
const effectiveBuyPricek = computed(() =>
  buy.pix ? (buy.pricek || 0) * 0.95 : buy.pricek || 0
);

const EXCLUDED_AIRLINES = new Set(["Azul", "TAP"]);
const airlines = computed(() => {
  const seen = new Map();
  for (const cpf of props.cpfs ?? []) {
    for (const acc of cpf.accounts ?? []) {
      if (
        acc.company?.type === "AIRLINE" &&
        !EXCLUDED_AIRLINES.has(acc.company.name) &&
        !seen.has(acc.company.name)
      ) {
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

function computeByAirline(totalMiles, totalCost) {
  const rows = airlines.value.map((a) => {
    const inp = inputs[a.value] ?? { bonus: 0, sale: 0 };
    const milesAfterBonus = totalMiles * (1 + (inp.bonus || 0) / 100);
    // Venda também em múltiplos de 1.000
    const sellable = Math.floor(milesAfterBonus / 1000) * 1000;
    const saleValue = (sellable * (inp.sale || 0)) / 1000;
    const profit = saleValue - totalCost;
    const margin = saleValue > 0 ? (profit / saleValue) * 100 : 0;
    return { airline: a.label, sellable, saleValue, profit, margin };
  });
  const maxProfit = Math.max(...rows.map((r) => r.profit), 0);
  if (maxProfit > 0) {
    for (const r of rows) r.best = r.profit === maxProfit;
  }
  return rows;
}

// Transferências só ocorrem em múltiplos de 1.000.
// SIMPLE: usa tudo disponível (após floor por programa).
// CARRINHO: meta arbitrária; usa o máximo do existente disponível, compra o resto a R$/1000.
const results = computed(() => {
  return (props.cpfs ?? []).map((cpf) => {
    const programs = (cpf.accounts ?? []).filter(
      (a) => a.company?.type === "PROGRAM"
    );

    let existingMiles = 0;
    let existingCost = 0;
    let availableFloored = 0;
    let floorLeftover = 0;
    for (const acc of programs) {
      const mi = acc.miles ?? 0;
      const ap = acc.averageMilePrice ?? 0;
      const fl = Math.floor(mi / 1000) * 1000;
      existingMiles += mi;
      existingCost += (mi * ap) / 1000;
      availableFloored += fl;
      floorLeftover += mi - fl;
    }
    const avgPriceExisting =
      existingMiles > 0 ? (existingCost / existingMiles) * 1000 : 0;

    if (isCarrinho.value) {
      const target = Math.floor((buy.target || 0) / 1000) * 1000;
      const useExisting = Math.min(availableFloored, target);
      const buyMiles = Math.max(target - useExisting, 0);
      const buyCost = (buyMiles * effectiveBuyPricek.value) / 1000;
      const useExistingCost = (useExisting * avgPriceExisting) / 1000;
      const totalCost = useExistingCost + buyCost;
      const totalMiles = target;
      const avgPrice = totalMiles > 0 ? (totalCost / totalMiles) * 1000 : 0;
      const byAirline = computeByAirline(totalMiles, totalCost);
      return {
        cpf,
        existingMiles,
        availableFloored,
        floorLeftover,
        target,
        useExisting,
        useExistingCost,
        buyMiles,
        buyCost,
        totalMiles,
        avgPrice,
        cost: totalCost,
        byAirline,
      };
    }

    // SIMPLE: usa tudo o disponível por programa (custo proporcional por programa)
    let totalMiles = 0;
    let totalCost = 0;
    for (const acc of programs) {
      const mi = acc.miles ?? 0;
      const ap = acc.averageMilePrice ?? 0;
      const fl = Math.floor(mi / 1000) * 1000;
      totalMiles += fl;
      totalCost += (fl * ap) / 1000;
    }
    const avgPrice = totalMiles > 0 ? (totalCost / totalMiles) * 1000 : 0;
    const byAirline = computeByAirline(totalMiles, totalCost);
    return {
      cpf,
      existingMiles,
      availableFloored,
      floorLeftover,
      totalMiles,
      avgPrice,
      cost: totalCost,
      byAirline,
    };
  });
});

const totals = computed(() => {
  const totalMiles = results.value.reduce((s, r) => s + r.totalMiles, 0);
  const cost = results.value.reduce((s, r) => s + r.cost, 0);
  const floorLeftover = results.value.reduce((s, r) => s + (r.floorLeftover || 0), 0);
  const avgPrice = totalMiles > 0 ? (cost / totalMiles) * 1000 : 0;
  const byAirline = computeByAirline(totalMiles, cost);
  return { totalMiles, avgPrice, cost, leftover: floorLeftover, byAirline };
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
