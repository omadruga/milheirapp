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
      <UFormGroup label="CPF" class="mb-2">
        <USelectMenu v-model="selectedCpf" :options="cpfOptions">
          <template #label>{{ selectedCpf?.label ?? "—" }}</template>
        </USelectMenu>
      </UFormGroup>
      <UFormGroup label="Total de milhas (enviadas + compradas)" class="mb-2">
        <UInput v-model.number="buy.total" type="number" min="0" step="1000" />
      </UFormGroup>
      <UFormGroup label="Enviadas (do existente)" class="mb-2">
        <UInput v-model.number="buy.sent" type="number" min="0" step="1000" />
        <template #help>
          Disponível neste CPF: {{ fmtMiles(selectedCpfAvailable) }}
        </template>
      </UFormGroup>
      <UFormGroup label="Custo total da compra (R$)" class="mb-2">
        <UInput v-model.number="buy.cost" type="number" min="0" step="0.01" />
      </UFormGroup>
      <div v-if="boughtMiles > 0" class="text-xs text-gray-500">
        Compradas: <span class="font-semibold">{{ fmtMiles(boughtMiles) }}</span>
        • Preço/milheiro: <span class="font-semibold">R$ {{ fmtMoney(boughtPricek) }}</span>
      </div>
      <div v-if="buy.sent > selectedCpfAvailable" class="text-xs text-red-600 mt-1">
        ⚠️ Enviadas ({{ fmtMiles(buy.sent) }}) excede disponível ({{ fmtMiles(selectedCpfAvailable) }})
      </div>
      <div class="text-xs text-gray-400 mt-2">
        12x sem juros (PIX desconsiderado).
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
            <template v-if="isCarrinho">
              <div class="flex justify-between">
                <span class="text-gray-500">Livelo:</span>
                <span>{{ fmtMiles(r.liveloMiles) }} a R$ {{ fmtMoney(r.liveloAvgPrice) }}/1000</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-500">Total simulado:</span>
                <span>{{ fmtMiles(r.target) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">→ Enviadas (Livelo):</span>
                <span>{{ fmtMiles(r.useExisting) }} (R$ {{ fmtMoney(r.useExistingCost) }})</span>
              </div>
              <div v-if="r.buyMiles > 0" class="flex justify-between">
                <span class="text-gray-500">→ Compradas:</span>
                <span>{{ fmtMiles(r.buyMiles) }} a R$ {{ fmtMoney(r.buyPricek) }}/1000 (R$ {{ fmtMoney(r.buyCost) }})</span>
              </div>
            </template>
            <template v-else>
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
            <div v-if="fmtAirlineExisting(r.airlineExisting)" class="flex justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-1 mt-1">
              <span>Já na cia (soma no pool):</span>
              <span>{{ fmtAirlineExisting(r.airlineExisting) }}</span>
            </div>
          </div>
          <table class="w-full text-xs">
            <thead class="text-gray-500">
              <tr>
                <th class="text-left py-1">Cia</th>
                <th class="text-right py-1">Vendável</th>
                <th class="text-right py-1" title="Custo Médio Milheiro">CMM</th>
                <th class="text-right py-1">Venda R$</th>
                <th class="text-right py-1">Lucro R$</th>
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
                <td class="text-right">{{ fmtMoney(row.combinedAvg) }}</td>
                <td class="text-right">{{ fmtMoney(row.saleValue) }}</td>
                <td
                  class="text-right"
                  :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ fmtMoney(row.profit) }}
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
        v-if="!isCarrinho && totals.totalMiles > 0"
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
              <th class="text-right py-1">Vendável</th>
              <th class="text-right py-1" title="Custo Médio Milheiro">C.M.M.</th>
              <th class="text-right py-1">Venda R$</th>
              <th class="text-right py-1">Lucro R$</th>
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
              <td class="text-right">{{ fmtMiles(row.sellable) }}</td>
              <td class="text-right">{{ fmtMoney(row.combinedAvg) }}</td>
              <td class="text-right">{{ fmtMoney(row.saleValue) }}</td>
              <td
                class="text-right"
                :class="row.profit >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ fmtMoney(row.profit) }}
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

const buy = reactive({ total: 0, sent: 0, cost: 0 });

const cpfOptions = computed(() =>
  (props.cpfs ?? []).map((c) => ({ label: c.name, value: c.id }))
);
const selectedCpf = ref(null);
watchEffect(() => {
  if (!selectedCpf.value && cpfOptions.value.length) {
    selectedCpf.value = cpfOptions.value[0];
  }
});

// No carrinho, "enviadas" sai do saldo Livelo do CPF (e não precisa ser múltiplo de 1000)
const selectedCpfLivelo = computed(() => {
  const c = (props.cpfs ?? []).find((c) => c.id === selectedCpf.value?.value);
  if (!c) return null;
  return (c.accounts ?? []).find((a) => a.company?.name === "Livelo") ?? null;
});
const selectedCpfAvailable = computed(() => selectedCpfLivelo.value?.miles ?? 0);
const selectedCpfLiveloAvgPrice = computed(
  () => selectedCpfLivelo.value?.averageMilePrice ?? 0
);

const boughtMiles = computed(() =>
  Math.max((buy.total || 0) - (buy.sent || 0), 0)
);
const boughtPricek = computed(() =>
  boughtMiles.value > 0 ? ((buy.cost || 0) / boughtMiles.value) * 1000 : 0
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

const STORAGE_KEY = "simulator-airline-inputs-v1";
const inputs = reactive({});

// Carrega valores salvos antes do watchEffect inicializar com zeros.
// onMounted só roda no client, então localStorage está disponível.
onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const [k, v] of Object.entries(saved || {})) {
      inputs[k] = {
        bonus: typeof v?.bonus === "number" ? v.bonus : 0,
        sale: typeof v?.sale === "number" ? v.sale : 0,
      };
    }
  } catch {}
});

watchEffect(() => {
  for (const a of airlines.value) {
    if (!inputs[a.value]) inputs[a.value] = { bonus: 0, sale: 0 };
  }
});

watch(
  inputs,
  (val) => {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch {}
  },
  { deep: true }
);

// totalMiles: milhas transferidas (programa)
// totalCost: custo das milhas transferidas
// airlineExisting: { [airlineName]: { miles, cost } } — saldo prévio na cia
function computeByAirline(totalMiles, totalCost, airlineExisting = {}) {
  const rows = airlines.value.map((a) => {
    const inp = inputs[a.value] ?? { bonus: 0, sale: 0 };
    const received = totalMiles * (1 + (inp.bonus || 0) / 100);
    const existing = airlineExisting[a.value] ?? { miles: 0, cost: 0 };
    const combinedMiles = received + existing.miles;
    const combinedCost = totalCost + existing.cost;
    const combinedAvg =
      combinedMiles > 0 ? (combinedCost / combinedMiles) * 1000 : 0;
    // Venda em múltiplo de 1.000
    const sellable = Math.floor(combinedMiles / 1000) * 1000;
    const costOfSellable =
      combinedMiles > 0 ? (sellable / combinedMiles) * combinedCost : 0;
    const saleValue = (sellable * (inp.sale || 0)) / 1000;
    const profit = saleValue - costOfSellable;
    const margin = saleValue > 0 ? (profit / saleValue) * 100 : 0;
    return {
      airline: a.label,
      received,
      existingMiles: existing.miles,
      combinedMiles,
      combinedAvg,
      sellable,
      costOfSellable,
      saleValue,
      profit,
      margin,
    };
  });
  const maxProfit = Math.max(...rows.map((r) => r.profit), 0);
  if (maxProfit > 0) {
    for (const r of rows) r.best = r.profit === maxProfit;
  }
  return rows;
}

// Extrai saldo + custo das contas AIRLINE de um CPF, em {nome: {miles, cost}}
function airlineExistingOf(cpf) {
  const out = {};
  for (const acc of cpf?.accounts ?? []) {
    if (acc.company?.type === "AIRLINE") {
      out[acc.company.name] = {
        miles: acc.miles ?? 0,
        cost: ((acc.miles ?? 0) * (acc.averageMilePrice ?? 0)) / 1000,
      };
    }
  }
  return out;
}

// Transferências só ocorrem em múltiplos de 1.000.
// SIMPLE: usa tudo disponível (após floor por programa). Mostra todos os CPFs.
// CARRINHO: usuário informa total + enviadas + custo da compra. Aplica a UM CPF.
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

    const airlineExisting = airlineExistingOf(cpf);

    if (isCarrinho.value) {
      // Carrinho só para o CPF selecionado
      if (cpf.id !== selectedCpf.value?.value) return null;

      const liveloMiles = selectedCpfLivelo.value?.miles ?? 0;
      const liveloAvgPrice = selectedCpfLivelo.value?.averageMilePrice ?? 0;

      const total = Math.floor((buy.total || 0) / 1000) * 1000;
      // sent pode ser não-múltiplo de 1000 (excepcional do carrinho Livelo)
      const sent = Math.max(buy.sent || 0, 0);
      const cost = buy.cost || 0;
      const bought = Math.max(total - sent, 0);
      const sentCost = (sent * liveloAvgPrice) / 1000;
      const totalCost = sentCost + cost;
      const totalMiles = total;
      const avgPrice = totalMiles > 0 ? (totalCost / totalMiles) * 1000 : 0;
      const boughtPricekLocal = bought > 0 ? (cost / bought) * 1000 : 0;
      const byAirline = computeByAirline(totalMiles, totalCost, airlineExisting);
      return {
        cpf,
        existingMiles,
        availableFloored,
        floorLeftover,
        liveloMiles,
        liveloAvgPrice,
        target: total,
        useExisting: sent,
        useExistingCost: sentCost,
        buyMiles: bought,
        buyCost: cost,
        buyPricek: boughtPricekLocal,
        totalMiles,
        avgPrice,
        cost: totalCost,
        airlineExisting,
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
    const byAirline = computeByAirline(totalMiles, totalCost, airlineExisting);
    return {
      cpf,
      existingMiles,
      availableFloored,
      floorLeftover,
      totalMiles,
      avgPrice,
      cost: totalCost,
      airlineExisting,
      byAirline,
    };
  }).filter((r) => r !== null);
});

const totals = computed(() => {
  const totalMiles = results.value.reduce((s, r) => s + r.totalMiles, 0);
  const cost = results.value.reduce((s, r) => s + r.cost, 0);
  const floorLeftover = results.value.reduce((s, r) => s + (r.floorLeftover || 0), 0);
  const avgPrice = totalMiles > 0 ? (cost / totalMiles) * 1000 : 0;
  // Agrega saldo cia entre CPFs
  const aggExisting = {};
  for (const r of results.value) {
    for (const [name, info] of Object.entries(r.airlineExisting ?? {})) {
      if (!aggExisting[name]) aggExisting[name] = { miles: 0, cost: 0 };
      aggExisting[name].miles += info.miles;
      aggExisting[name].cost += info.cost;
    }
  }
  const byAirline = computeByAirline(totalMiles, cost, aggExisting);
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
function fmtAirlineExisting(airlineExisting) {
  if (!airlineExisting) return "";
  const parts = [];
  for (const a of airlines.value) {
    const info = airlineExisting[a.value];
    if (info && info.miles > 0) {
      const avg = info.miles > 0 ? (info.cost / info.miles) * 1000 : 0;
      parts.push(`${a.label} ${fmtMiles(info.miles)} (R$ ${fmtMoney(avg)}/k)`);
    }
  }
  return parts.join(" • ");
}
</script>
