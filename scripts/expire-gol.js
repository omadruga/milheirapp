// Insere EXPIRE de 200 milhas no Gol em 01/01/2026 e recalcula.
// Idempotente: checa se já existe EXPIRE no Gol nesse dia com esse valor.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GOL = 9;
const DATE = "2026-01-01";
const MILES = 200;

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
  console.log(`  recalculado Gol: miles=${miles} avgPrice=${averagePrice.toFixed(4)} seats=${seatsUsed}/${seats}`);
}

async function main() {
  const startDay = new Date(DATE + "T00:00:00.000Z");
  const endDay = new Date(DATE + "T23:59:59.999Z");

  const existing = await prisma.transaction.findFirst({
    where: { accountId: GOL, type: "EXPIRE", date: { gte: startDay, lte: endDay }, miles: MILES },
  });

  if (existing) {
    console.log(`SKIP: já existe EXPIRE de ${MILES} milhas no Gol em ${DATE} (#${existing.id})`);
  } else {
    const result = await prisma.transaction.create({
      data: {
        type: "EXPIRE",
        date: new Date(DATE + "T12:00:00.000Z"),
        miles: MILES,
        description: "expiracao automatica virada de ano",
        account: { connect: { id: GOL } },
      },
    });
    console.log(`INS EXPIRE ${MILES} milhas Gol ${DATE} → #${result.id}`);
  }

  console.log("\n=== Recalculando Gol ===");
  await calculate(GOL);

  console.log("\n=== Estado final Gol ===");
  const gol = await prisma.account.findUnique({ where: { id: GOL }, include: { company: true } });
  console.log(`  miles=${gol.miles?.toLocaleString()} avgPrice=${gol.averageMilePrice?.toFixed(4)} seats=${gol.seatsUsed}/${gol.seats}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
