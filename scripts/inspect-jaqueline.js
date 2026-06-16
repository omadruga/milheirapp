// Dump contas + histórico Livelo (e Latam pra futuro) da Jaqueline.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CPF = "057.274.369-66";

function fmt(t) {
  const acc = t.account.company.name;
  const dest = t.accountTo ? `→${t.accountTo.company.name}` : "";
  return `  #${String(t.id).padStart(4)} ${t.date.toISOString().slice(0, 10)} ${t.type.padEnd(13)} ${acc.padEnd(10)}${dest.padEnd(8)} miles=${String(t.miles ?? "-").padStart(7)} milesTo=${String(t.milesTo ?? "-").padStart(7)} cost=${String(t.cost ?? "-").padStart(7)} desc="${t.description ?? ""}"`;
}

async function main() {
  const cpf = await prisma.cpf.findUnique({ where: { cpf: CPF } });
  if (!cpf) { console.log("CPF não achado"); return; }
  console.log(`CPF: id=${cpf.id} ${cpf.name} ${cpf.cpf}`);

  console.log("\n=== Contas ===");
  const accounts = await prisma.account.findMany({
    where: { cpfId: cpf.id },
    include: { company: true },
    orderBy: { company: { name: "asc" } },
  });
  accounts.forEach((a) =>
    console.log(`  accountId=${a.id} ${a.company.name.padEnd(12)} type=${a.company.type} miles=${a.miles} avgPrice=${a.averageMilePrice} seats=${a.seatsUsed}/${a.seats}`)
  );

  const livelo = accounts.find((a) => a.company.name === "Livelo");
  const latam = accounts.find((a) => a.company.name === "Latam");

  if (livelo) {
    console.log(`\n=== Livelo histórico completo (accountId=${livelo.id}) ===`);
    const txs = await prisma.transaction.findMany({
      where: { OR: [{ accountId: livelo.id }, { accountToId: livelo.id }] },
      include: {
        account: { include: { company: true } },
        accountTo: { include: { company: true } },
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
    txs.forEach((t) => console.log(fmt(t)));
    console.log(`  (total: ${txs.length})`);
  }

  if (latam) {
    console.log(`\n=== Latam histórico completo (accountId=${latam.id}) ===`);
    const txs = await prisma.transaction.findMany({
      where: { OR: [{ accountId: latam.id }, { accountToId: latam.id }] },
      include: {
        account: { include: { company: true } },
        accountTo: { include: { company: true } },
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
    txs.forEach((t) => console.log(fmt(t)));
    console.log(`  (total: ${txs.length})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
