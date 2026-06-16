// Finaliza extrato Latam Jaqueline:
//   1) #366: milesTo null → 56000
//   2) #291: data 2024-11-30 → 2024-11-29
//   3) Insere FLIGHT 57244 em 2025-11-28 (cpfs=1)
//   4) Recalcula Latam Jaqueline

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LATAM_J = 6;

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
  console.log(`  recalculado Latam Jaqueline: miles=${miles} avgPrice=${averagePrice.toFixed(4)} seats=${seatsUsed}/${seats}`);
}

async function main() {
  // 1) update #366 milesTo
  const t366 = await prisma.transaction.update({
    where: { id: 366 },
    data: { milesTo: 56000, description: "Resgate LATAM Pass" },
  });
  console.log(`UPDATE #366 milesTo → ${t366.milesTo}`);

  // 2) update #291 date
  const t291 = await prisma.transaction.update({
    where: { id: 291 },
    data: { date: new Date("2024-11-29T12:00:00.000Z") },
  });
  console.log(`UPDATE #291 date → ${t291.date.toISOString().slice(0, 10)}`);

  // 3) insert FLIGHT (idempotente)
  const startDay = new Date("2025-11-28T00:00:00.000Z");
  const endDay = new Date("2025-11-28T23:59:59.999Z");
  const existing = await prisma.transaction.findFirst({
    where: { accountId: LATAM_J, type: "FLIGHT", date: { gte: startDay, lte: endDay }, miles: 57244 },
  });
  if (existing) {
    console.log(`SKIP FLIGHT 57244 já existe (#${existing.id})`);
  } else {
    const flight = await prisma.transaction.create({
      data: {
        type: "FLIGHT",
        date: new Date("2025-11-28T12:00:00.000Z"),
        miles: 57244,
        cpfs: 1,
        description: "LATAM AIRLINES Canje Aereo",
        account: { connect: { id: LATAM_J } },
      },
    });
    console.log(`INS FLIGHT 57244 cpfs=1 → #${flight.id}`);
  }

  // 4) recalc
  console.log("\n=== Recalculando Latam Jaqueline ===");
  await calculate(LATAM_J);

  console.log("\n=== Estado final ===");
  const latam = await prisma.account.findUnique({
    where: { id: LATAM_J },
    include: { company: true },
  });
  console.log(`  Latam Jaqueline miles=${latam.miles?.toLocaleString()} avgPrice=${latam.averageMilePrice?.toFixed(4)} seats=${latam.seatsUsed}/${latam.seats}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
