// Import dos extratos Latam (2025-11-27 e 2025-11-28) e Livelo (2025-03-25 → 2026-05-25)
// para CPF 056.013.119-43.
//
// COMO RODAR:
//   $env:DATABASE_URL="postgres://...prod..."; node scripts/import-extracts.js
//
// Idempotente: cada inserção checa se já existe (date+accountId+type+miles)
// antes. Pode rodar 2x sem duplicar.
//
// Depois insere, dispara await calculate() para Livelo, C6 e Latam (na ordem),
// pra recalcular saldos, preço médio, e CPFs usados na Latam.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LIVELO = 1;
const C6 = 3;
const LATAM = 7;

// Lista mestra de transações novas (em ordem cronológica).
// type: BUY|MEMBERSHIP|PARTNER|TRANSFER|FLIGHT
const TXS = [
  // === Livelo Mar/2025 ===
  { date: "2025-03-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Abr/2025 ===
  { date: "2025-04-12", account: LIVELO, type: "PARTNER", miles: 534, description: "fidelidade bradesco" },
  { date: "2025-04-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Mai/2025 ===
  { date: "2025-05-14", account: LIVELO, type: "PARTNER", miles: 1506, description: "fidelidade bradesco" },
  { date: "2025-05-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  { date: "2025-05-25", account: LIVELO, type: "PARTNER", miles: 500, description: "bonus clube" },
  // === Livelo Jun/2025 ===
  { date: "2025-06-12", account: LIVELO, type: "PARTNER", miles: 677, description: "fidelidade bradesco" },
  { date: "2025-06-17", account: LIVELO, type: "PARTNER", miles: 1804, description: "Angeloni" },
  { date: "2025-06-17", account: LIVELO, type: "PARTNER", miles: 15, description: "Angeloni" },
  { date: "2025-06-17", account: LIVELO, type: "PARTNER", miles: 271, description: "Angeloni" },
  { date: "2025-06-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Jul/2025 ===
  { date: "2025-07-12", account: LIVELO, type: "PARTNER", miles: 857, description: "fidelidade bradesco" },
  { date: "2025-07-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Ago/2025 ===
  { date: "2025-08-13", account: LIVELO, type: "PARTNER", miles: 1533, description: "fidelidade bradesco" },
  { date: "2025-08-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  { date: "2025-08-25", account: LIVELO, type: "PARTNER", miles: 500, description: "bonus clube" },
  // === Livelo Set/2025 ===
  { date: "2025-09-12", account: LIVELO, type: "PARTNER", miles: 478, description: "fidelidade bradesco" },
  { date: "2025-09-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Out/2025 ===
  { date: "2025-10-14", account: LIVELO, type: "PARTNER", miles: 1022, description: "fidelidade bradesco" },
  { date: "2025-10-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Nov/2025 + Latam ===
  { date: "2025-11-12", account: LIVELO, type: "PARTNER", miles: 942, description: "fidelidade bradesco" },
  { date: "2025-11-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  { date: "2025-11-25", account: LIVELO, type: "PARTNER", miles: 500, description: "bonus clube" },
  { date: "2025-11-27", account: C6, accountTo: LATAM, type: "TRANSFER", miles: 18100, milesTo: 23530, description: "transferencia bonificada 30%" },
  { date: "2025-11-28", account: LIVELO, type: "BUY", miles: 47808, cost: 1505.98, description: "turbo livelo" },
  { date: "2025-11-28", account: LIVELO, accountTo: LATAM, type: "TRANSFER", miles: 68000, milesTo: 68000 },
  { date: "2025-11-28", account: LATAM, type: "FLIGHT", miles: 114488, cpfs: 2, description: "LATAM AIRLINES Canje Aereo" },
  // === Livelo Dez/2025 ===
  { date: "2025-12-12", account: LIVELO, type: "PARTNER", miles: 945, description: "fidelidade bradesco" },
  { date: "2025-12-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Jan/2026 ===
  { date: "2026-01-14", account: LIVELO, type: "PARTNER", miles: 1572, description: "fidelidade bradesco" },
  { date: "2026-01-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Fev/2026 ===
  { date: "2026-02-12", account: LIVELO, type: "PARTNER", miles: 1301, description: "fidelidade bradesco" },
  { date: "2026-02-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  { date: "2026-02-25", account: LIVELO, type: "PARTNER", miles: 500, description: "bonus clube" },
  // === Livelo Mar/2026 ===
  { date: "2026-03-17", account: LIVELO, type: "PARTNER", miles: 2949, description: "Mercado Livre" },
  { date: "2026-03-24", account: LIVELO, type: "PARTNER", miles: 1785, description: "fidelidade bradesco" },
  { date: "2026-03-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Abr/2026 ===
  { date: "2026-04-23", account: LIVELO, type: "PARTNER", miles: 1654, description: "fidelidade bradesco" },
  { date: "2026-04-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  // === Livelo Mai/2026 ===
  { date: "2026-05-22", account: LIVELO, type: "PARTNER", miles: 1445, description: "fidelidade bradesco" },
  { date: "2026-05-25", account: LIVELO, type: "MEMBERSHIP", miles: 1000, cost: 44.9, description: "clube" },
  { date: "2026-05-25", account: LIVELO, type: "PARTNER", miles: 500, description: "bonus clube" },
];

function buildData(t) {
  const data = {
    type: t.type,
    date: new Date(t.date + "T12:00:00.000Z"),
    description: t.description ?? null,
    miles: t.miles,
    milesTo: null,
    cost: null,
    expire: null,
    averagePrice: null,
    cpfs: null,
    milesBuy: null,
    averagePriceTransfer: null,
  };

  if (t.type === "BUY" || t.type === "MEMBERSHIP") {
    data.cost = t.cost;
    data.averagePrice = (t.cost / t.miles) * 1000;
  } else if (t.type === "PARTNER") {
    data.cost = 0;
    data.averagePrice = 0;
  } else if (t.type === "TRANSFER") {
    data.milesTo = t.milesTo;
  } else if (t.type === "FLIGHT") {
    data.cpfs = t.cpfs;
  }
  return data;
}

async function exists(t) {
  const startDay = new Date(t.date + "T00:00:00.000Z");
  const endDay = new Date(t.date + "T23:59:59.999Z");
  return await prisma.transaction.findFirst({
    where: {
      date: { gte: startDay, lte: endDay },
      accountId: t.account,
      type: t.type,
      miles: t.miles,
      ...(t.accountTo ? { accountToId: t.accountTo } : {}),
    },
  });
}

// Re-implementa o calculate() do server/data/transactions.js direto aqui
// (não dá pra importar porque server/data depende de #dayjs do Nuxt).
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function startOfYear() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}
function isAfter(a, b) {
  return new Date(a).getTime() > new Date(b).getTime();
}
function isBefore(a, b) {
  return new Date(a).getTime() < new Date(b).getTime();
}

async function calculate(accountId) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { company: { select: { type: true, name: true } } },
  });
  if (!account) return;
  const companyType = account.company.type;
  const companyName = account.company.name;

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ accountId }, { accountToId: accountId }],
    },
    include: {
      account: { include: { company: { select: { type: true, name: true } } } },
      accountTo: true,
    },
    orderBy: [{ date: "asc" }, { type: "asc" }, { id: "asc" }],
  });

  let miles = 0;
  let averagePrice = 0;
  let expire = null;
  let seats = 0;
  let seatsUsed = 0;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];

    if (t.type == "BUY" || t.type == "MEMBERSHIP" || t.type == "PARTNER") {
      if (i == 0) {
        miles = t.miles;
        averagePrice = t.averagePrice;
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles + t.averagePrice * t.miles) / (t.miles + miles);
        }
        miles += t.miles;
      }
      if (miles < 0) miles = 0;
    } else if (t.type == "FLIGHT" || t.type == "EXPIRE") {
      miles -= t.miles;
      if (miles < 0) miles = 0;
    } else if (t.type == "TRANSFER") {
      if (t.accountId == accountId) {
        await prisma.transaction.update({
          where: { id: t.id },
          data: { averagePriceTransfer: averagePrice },
        });
        miles -= t.miles;
        if (miles < 0) miles = 0;
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles + t.averagePriceTransfer * t.miles) /
            (t.milesTo + miles);
        }
        miles += t.milesTo;
        if (miles < 0) miles = 0;
      }
    } else if (t.type == "TRANSFER_BUY") {
      if (t.accountId == accountId) {
        averagePrice =
          (averagePrice * miles + t.averagePrice * t.milesBuy) /
          (t.milesBuy + miles);
        miles += t.milesBuy;
        await prisma.transaction.update({
          where: { id: t.id },
          data: { averagePriceTransfer: averagePrice },
        });
        miles -= t.miles + t.milesBuy;
        if (miles < 0) miles = 0;
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles + t.averagePriceTransfer * (t.miles + t.milesBuy)) /
            (t.milesTo + miles);
        }
        miles += t.milesTo;
        if (miles < 0) miles = 0;
      }
    }

    if (t.account.company.type == "AIRLINE") {
      let start = null;
      switch (t.account.company.name) {
        case "Latam":
          seats = 24;
          start = daysAgo(366);
          break;
        case "Gol":
          seats = 25;
          start = startOfYear();
          break;
      }
      if (start && isAfter(t.date, start) && t.cpfs && t.cpfs > 0) {
        seatsUsed += t.cpfs;
      }
    }

    if (miles == 0) {
      expire = null;
    } else if (t.expire) {
      if (!expire || isBefore(t.expire, expire)) expire = t.expire;
    }
  }

  if (miles == 0) averagePrice = 0;

  if (companyType == "PROGRAM") {
    await prisma.account.update({
      where: { id: accountId },
      data: { miles, averageMilePrice: averagePrice },
    });
  } else if (companyType == "AIRLINE") {
    await prisma.account.update({
      where: { id: accountId },
      data: { miles, averageMilePrice: averagePrice, seats, seatsUsed },
    });
  }
  console.log(`  recalculado ${companyName}: miles=${miles} avgPrice=${averagePrice.toFixed(4)} seats=${seatsUsed}/${seats}`);
}

async function main() {
  console.log(`=== Inserindo ${TXS.length} transações ===\n`);
  let inserted = 0;
  let skipped = 0;

  for (const t of TXS) {
    const existing = await exists(t);
    if (existing) {
      console.log(`  SKIP  ${t.date} acc=${t.account}→${t.accountTo ?? "-"} ${t.type.padEnd(11)} ${t.miles} → já existe (#${existing.id})`);
      skipped++;
      continue;
    }

    const data = buildData(t);
    const create = {
      ...data,
      account: { connect: { id: t.account } },
      ...(t.accountTo ? { accountTo: { connect: { id: t.accountTo } } } : {}),
    };
    const result = await prisma.transaction.create({ data: create });
    console.log(`  INS   ${t.date} acc=${t.account}→${t.accountTo ?? "-"} ${t.type.padEnd(11)} ${t.miles} → #${result.id}`);
    inserted++;
  }

  console.log(`\n=== Resumo: ${inserted} inseridas, ${skipped} já existiam ===`);

  console.log(`\n=== Recalculando contas afetadas ===`);
  await calculate(LIVELO);
  await calculate(C6);
  await calculate(LATAM);

  console.log(`\n=== Estado final ===`);
  const accs = await prisma.account.findMany({
    where: { id: { in: [LIVELO, C6, LATAM] } },
    include: { company: { select: { name: true } } },
    orderBy: { id: "asc" },
  });
  accs.forEach((a) =>
    console.log(
      `  ${a.company.name.padEnd(10)} miles=${a.miles?.toLocaleString()} avgPrice=${a.averageMilePrice?.toFixed(4)} seats=${a.seatsUsed}/${a.seats}`
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
