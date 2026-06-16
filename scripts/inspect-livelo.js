// Dumpa histórico completo de Livelo e C6 Átomos do CPF do dono.
// Read-only.
//
// COMO RODAR:
//   $env:DATABASE_URL="postgres://..."; node scripts/inspect-livelo.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LIVELO_ID = 1;
const C6_ID = 3;
const LATAM_ID = 7;

function fmt(t) {
  const acc = t.account.company.name;
  const dest = t.accountTo ? `→${t.accountTo.company.name}` : "";
  return `  #${String(t.id).padStart(4)} ${t.date.toISOString().slice(0, 10)} ${t.type.padEnd(13)} ${acc.padEnd(10)}${dest.padEnd(8)} miles=${String(t.miles ?? "-").padStart(8)} milesTo=${String(t.milesTo ?? "-").padStart(8)} cost=${String(t.cost ?? "-").padStart(8)} avgPrice=${t.averagePrice ?? "-"} desc="${t.description ?? ""}"`;
}

async function dumpAccount(id, label) {
  console.log(`\n=== Histórico completo de ${label} (accountId=${id}) ===`);
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [{ accountId: id }, { accountToId: id }],
    },
    include: {
      account: { include: { company: true } },
      accountTo: { include: { company: true } },
    },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
  txs.forEach((t) => console.log(fmt(t)));
  console.log(`  (total: ${txs.length} transações)`);
}

async function main() {
  await dumpAccount(LIVELO_ID, "Livelo");
  await dumpAccount(C6_ID, "C6 Átomos");
  console.log(`\n=== Estado atual das contas ===`);
  const accs = await prisma.account.findMany({
    where: { id: { in: [LIVELO_ID, C6_ID, LATAM_ID] } },
    include: { company: { select: { name: true } } },
  });
  accs.forEach((a) =>
    console.log(
      `  ${a.company.name.padEnd(10)} id=${a.id} miles=${a.miles} avgPrice=${a.averageMilePrice} seats=${a.seatsUsed}/${a.seats}`
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
