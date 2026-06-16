// Dump completo de todas as transações da Latam (id=7). Read-only.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LATAM = 7;

function fmt(t) {
  const acc = t.account.company.name;
  const dest = t.accountTo ? `→${t.accountTo.company.name}` : "";
  return `  #${String(t.id).padStart(4)} ${t.date.toISOString().slice(0, 10)} ${t.type.padEnd(13)} ${acc.padEnd(10)}${dest.padEnd(8)} miles=${String(t.miles ?? "-").padStart(8)} milesTo=${String(t.milesTo ?? "-").padStart(8)} cpfs=${t.cpfs ?? "-"} desc="${t.description ?? ""}"`;
}

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { OR: [{ accountId: LATAM }, { accountToId: LATAM }] },
    include: {
      account: { include: { company: true } },
      accountTo: { include: { company: true } },
    },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });

  console.log(`=== Latam histórico completo (${txs.length} transações) ===`);
  txs.forEach((t) => console.log(fmt(t)));

  let recv = 0, sent = 0;
  txs.forEach((t) => {
    if (t.type === "FLIGHT" || t.type === "EXPIRE") sent += t.miles;
    else if (t.type === "TRANSFER" && t.accountToId === LATAM) recv += t.milesTo;
    else if (t.type === "TRANSFER_BUY" && t.accountToId === LATAM) recv += t.milesTo;
  });
  console.log(`\n  TOTAL recebido: ${recv.toLocaleString()}`);
  console.log(`  TOTAL gasto:    ${sent.toLocaleString()}`);
  console.log(`  Saldo teórico:  ${(recv - sent).toLocaleString()}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
