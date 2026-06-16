// Import Livelo Jaqueline (id=2) — extrato 15/04/2025 → 13/06/2026.
// TRANSFER pra Latam fica com milesTo=null (será preenchido quando vier extrato Latam).
// Idempotente. Recalcula só Livelo no fim.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LIVELO_J = 2;
const LATAM_J = 6;

const TXS = [
  { date: "2025-04-15", account: LIVELO_J, type: "PARTNER", miles: 1239, description: "fidelidade bb" },
  { date: "2025-05-07", account: LIVELO_J, type: "PARTNER", miles: 300,  description: "fidelidade bb" },
  { date: "2025-05-15", account: LIVELO_J, type: "PARTNER", miles: 1039, description: "fidelidade bb" },
  { date: "2025-06-13", account: LIVELO_J, type: "PARTNER", miles: 876,  description: "fidelidade bb" },
  { date: "2025-07-15", account: LIVELO_J, type: "PARTNER", miles: 1042, description: "fidelidade bb" },
  { date: "2025-08-14", account: LIVELO_J, type: "PARTNER", miles: 1131, description: "fidelidade bb" },
  { date: "2025-08-28", account: LIVELO_J, type: "PARTNER", miles: 5000, description: "MoBBSeg 1S25" },
  { date: "2025-09-13", account: LIVELO_J, type: "PARTNER", miles: 778,  description: "fidelidade bb" },
  { date: "2025-10-15", account: LIVELO_J, type: "PARTNER", miles: 731,  description: "fidelidade bb" },
  { date: "2025-11-13", account: LIVELO_J, type: "PARTNER", miles: 1111, description: "fidelidade bb" },
  { date: "2025-11-28", account: LIVELO_J, type: "BUY", miles: 35088, cost: 1105.29, description: "turbo livelo" },
  { date: "2025-11-28", account: LIVELO_J, accountTo: LATAM_J, type: "TRANSFER", miles: 56000, milesTo: null, description: "Resgate LATAM Pass — milesTo pendente" },
  { date: "2025-12-13", account: LIVELO_J, type: "PARTNER", miles: 1242, description: "fidelidade bb" },
  { date: "2026-01-15", account: LIVELO_J, type: "PARTNER", miles: 782,  description: "fidelidade bb" },
  { date: "2026-02-14", account: LIVELO_J, type: "PARTNER", miles: 1497, description: "fidelidade bb" },
  { date: "2026-03-12", account: LIVELO_J, type: "PARTNER", miles: 1461, description: "fidelidade bb" },
  { date: "2026-04-17", account: LIVELO_J, type: "PARTNER", miles: 1472, description: "fidelidade bb" },
  { date: "2026-05-14", account: LIVELO_J, type: "PARTNER", miles: 1167, description: "fidelidade bb" },
  { date: "2026-05-23", account: LIVELO_J, type: "PARTNER", miles: 96,   description: "fidelidade bb" },
  { date: "2026-06-13", account: LIVELO_J, type: "PARTNER", miles: 1129, description: "fidelidade bb" },
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

// --- calculate() inline (mesmo do server, sem dayjs) ---
function daysAgo(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }
function startOfYear() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); }
function isAfter(a, b) { return new Date(a).getTime() > new Date(b).getTime(); }
function isBefore(a, b) { return new Date(a).getTime() < new Date(b).getTime(); }

async function calculate(accountId) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { company: { select: { type: true, name: true } } },
  });
  if (!account) return;
  const companyType = account.company.type;

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ accountId }, { accountToId: accountId }] },
    include: {
      account: { include: { company: { select: { type: true, name: true } } } },
      accountTo: true,
    },
    orderBy: [{ date: "asc" }, { type: "asc" }, { id: "asc" }],
  });

  let miles = 0, averagePrice = 0, expire = null, seats = 0, seatsUsed = 0;
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.type == "BUY" || t.type == "MEMBERSHIP" || t.type == "PARTNER") {
      if (i == 0) { miles = t.miles; averagePrice = t.averagePrice; }
      else {
        if (t.miles > 0) averagePrice = (averagePrice * miles + t.averagePrice * t.miles) / (t.miles + miles);
        miles += t.miles;
      }
      if (miles < 0) miles = 0;
    } else if (t.type == "FLIGHT" || t.type == "EXPIRE") {
      miles -= t.miles;
      if (miles < 0) miles = 0;
    } else if (t.type == "TRANSFER") {
      if (t.accountId == accountId) {
        await prisma.transaction.update({ where: { id: t.id }, data: { averagePriceTransfer: averagePrice } });
        miles -= t.miles;
        if (miles < 0) miles = 0;
      } else {
        if (t.miles > 0) averagePrice = (averagePrice * miles + t.averagePriceTransfer * t.miles) / (t.milesTo + miles);
        miles += t.milesTo;
        if (miles < 0) miles = 0;
      }
    } else if (t.type == "TRANSFER_BUY") {
      if (t.accountId == accountId) {
        averagePrice = (averagePrice * miles + t.averagePrice * t.milesBuy) / (t.milesBuy + miles);
        miles += t.milesBuy;
        await prisma.transaction.update({ where: { id: t.id }, data: { averagePriceTransfer: averagePrice } });
        miles -= t.miles + t.milesBuy;
        if (miles < 0) miles = 0;
      } else {
        if (t.miles > 0) averagePrice = (averagePrice * miles + t.averagePriceTransfer * (t.miles + t.milesBuy)) / (t.milesTo + miles);
        miles += t.milesTo;
        if (miles < 0) miles = 0;
      }
    }

    if (t.account.company.type == "AIRLINE") {
      let start = null;
      switch (t.account.company.name) {
        case "Latam": seats = 24; start = daysAgo(366); break;
        case "Gol":   seats = 25; start = startOfYear(); break;
      }
      if (start && isAfter(t.date, start) && t.cpfs && t.cpfs > 0) seatsUsed += t.cpfs;
    }
    if (miles == 0) expire = null;
    else if (t.expire) { if (!expire || isBefore(t.expire, expire)) expire = t.expire; }
  }
  if (miles == 0) averagePrice = 0;

  if (companyType == "PROGRAM") {
    await prisma.account.update({ where: { id: accountId }, data: { miles, averageMilePrice: averagePrice } });
  } else if (companyType == "AIRLINE") {
    await prisma.account.update({ where: { id: accountId }, data: { miles, averageMilePrice: averagePrice, seats, seatsUsed } });
  }
  console.log(`  recalculado ${account.company.name}: miles=${miles} avgPrice=${averagePrice.toFixed(4)}`);
}

async function main() {
  console.log(`=== Inserindo ${TXS.length} transações (Livelo Jaqueline) ===\n`);
  let inserted = 0, skipped = 0;
  for (const t of TXS) {
    const existing = await exists(t);
    if (existing) {
      console.log(`  SKIP  ${t.date} ${t.type.padEnd(11)} ${t.miles} → #${existing.id}`);
      skipped++;
      continue;
    }
    const data = buildData(t);
    const create = {
      ...data,
      account: { connect: { id: t.account } },
      ...(t.accountTo ? { accountTo: { connect: { id: t.accountTo } } } : {}),
    };
    const r = await prisma.transaction.create({ data: create });
    console.log(`  INS   ${t.date} ${t.type.padEnd(11)} ${t.miles}${t.accountTo ? ` →Latam(milesTo=${t.milesTo ?? "null"})` : ""} → #${r.id}`);
    inserted++;
  }
  console.log(`\n=== Resumo: ${inserted} inseridas, ${skipped} já existiam ===`);

  console.log(`\n=== Recalculando Livelo Jaqueline (id=${LIVELO_J}) ===`);
  await calculate(LIVELO_J);

  console.log(`\n=== Estado final ===`);
  const acc = await prisma.account.findUnique({ where: { id: LIVELO_J }, include: { company: true } });
  console.log(`  Livelo Jaqueline miles=${acc.miles?.toLocaleString()} avgPrice=${acc.averageMilePrice?.toFixed(4)}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
