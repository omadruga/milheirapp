// Inspeção read-only para preparar import do extrato Latam (CPF 056013119433).
//
// COMO RODAR (PowerShell):
//   $env:DATABASE_URL="postgresql://...prod..."; node scripts/inspect-latam.js
//
// Não escreve nada. Só lista contas, transações nos dias do extrato, e exemplos
// históricos de TRANSFER Livelo→Latam / C6→Latam pra ver como você modelou bonus.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CPF = "056.013.119-43";
const CPF_ALT = "05601311943";
const DATES = ["2025-03-24", "2025-11-27", "2025-11-28"];

function fmt(t) {
  const dest = t.accountTo
    ? `→ ${t.accountTo.company.name} (${t.accountTo.cpf.cpf})`
    : "";
  return `  #${t.id} ${t.date.toISOString().slice(0, 10)} ${t.type.padEnd(13)} miles=${t.miles ?? "-"} milesTo=${t.milesTo ?? "-"} cost=${t.cost ?? "-"} avgPrice=${t.averagePrice ?? "-"} avgPriceXfer=${t.averagePriceTransfer ?? "-"} cpfs=${t.cpfs ?? "-"} ${dest} ${t.description ? `"${t.description}"` : ""}`;
}

async function main() {
  console.log("=== Buscando CPF ===");
  let cpf = await prisma.cpf.findUnique({ where: { cpf: CPF } });
  if (!cpf) cpf = await prisma.cpf.findUnique({ where: { cpf: CPF_ALT } });
  if (!cpf) {
    console.log(`CPF ${CPF} / ${CPF_ALT} NÃO encontrado. Listando todos:`);
    const all = await prisma.cpf.findMany();
    all.forEach((c) => console.log(`  id=${c.id} name="${c.name}" cpf=${c.cpf}`));
    return;
  }
  console.log(`OK: id=${cpf.id} name="${cpf.name}" cpf=${cpf.cpf}`);

  console.log("\n=== Contas desse CPF ===");
  const accounts = await prisma.account.findMany({
    where: { cpfId: cpf.id },
    include: { company: true },
    orderBy: { company: { name: "asc" } },
  });
  accounts.forEach((a) =>
    console.log(
      `  accountId=${a.id} ${a.company.name.padEnd(12)} type=${a.company.type} miles=${a.miles} avgPrice=${a.averageMilePrice} seats=${a.seatsUsed}/${a.seats}`
    )
  );

  const latam = accounts.find((a) => a.company.name === "Latam");
  const livelo = accounts.find((a) => a.company.name === "Livelo");
  const c6 = accounts.find(
    (a) => a.company.name === "C6 Átomos" || a.company.name === "C6 Atomos"
  );
  console.log(
    `\n>>> Latam=${latam?.id} Livelo=${livelo?.id} C6=${c6?.id}`
  );
  if (!latam || !livelo || !c6) {
    console.log("ATENÇÃO: alguma das 3 contas não foi encontrada.");
  }

  console.log("\n=== Transações já existentes nos dias do extrato (qualquer conta desse CPF) ===");
  for (const d of DATES) {
    const start = new Date(d + "T00:00:00.000Z");
    const end = new Date(d + "T23:59:59.999Z");
    const txs = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: end },
        OR: [
          { account: { cpfId: cpf.id } },
          { accountTo: { cpfId: cpf.id } },
        ],
      },
      include: {
        account: { include: { company: true, cpf: true } },
        accountTo: { include: { company: true, cpf: true } },
      },
      orderBy: { id: "asc" },
    });
    console.log(`\n  -- ${d} (${txs.length} achadas) --`);
    txs.forEach((t) => console.log(fmt(t)));
  }

  if (latam) {
    console.log("\n=== Últimas 5 TRANSFER recebidas pela Latam desse CPF (pra ver padrão de bonus) ===");
    const xfers = await prisma.transaction.findMany({
      where: { type: "TRANSFER", accountToId: latam.id },
      include: {
        account: { include: { company: true, cpf: true } },
        accountTo: { include: { company: true, cpf: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    });
    xfers.forEach((t) => console.log(fmt(t)));

    console.log("\n=== Últimas 5 FLIGHT na Latam desse CPF ===");
    const flights = await prisma.transaction.findMany({
      where: { type: "FLIGHT", accountId: latam.id },
      include: {
        account: { include: { company: true, cpf: true } },
        accountTo: { include: { company: true, cpf: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    });
    flights.forEach((t) => console.log(fmt(t)));

    console.log("\n=== Últimas 5 PARTNER na Latam desse CPF (vê se bonus vira PARTNER separado) ===");
    const partners = await prisma.transaction.findMany({
      where: { type: "PARTNER", accountId: latam.id },
      include: {
        account: { include: { company: true, cpf: true } },
        accountTo: { include: { company: true, cpf: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    });
    partners.forEach((t) => console.log(fmt(t)));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
