// Importa as vendas historicas dos 4 programas (Nextgate, MaxMilhas, Bankmilhas, Hotmilhas).
// Rodar APOS o deploy que aplica a migration (colunas + enum SALE existem em prod).
//   export $(grep -v '^#' .env.prod | grep DATABASE_URL_NON_POLLING | sed 's/_NON_POLLING//' | xargs) && node scripts/import-sales.mjs
// (usa DATABASE_URL; passe a nao-poolada se preferir)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// contas airline do Gustavo
const ACC = { LATAM: 7, AZUL: 8, GOL: 9 };

// programa (por nome) -> resolvido para company.id abaixo
const sales = [
  // NEXTGATE (exato) - Gustavo Latam
  { prog: "Nextgate", acc: ACC.LATAM, date: "2026-07-06", miles: 120166, received: 3002.95, previsto: 3002.95, status: "PAID", desc: "Nextgate 12567" },

  // MAXMILHAS (exato) - status Recebido = PAID
  { prog: "MaxMilhas", acc: ACC.LATAM, date: "2022-12-10", miles: 9685,  received: 241.83,  previsto: 241.83,  status: "PAID", desc: "MaxMilhas 7160633 DBOSTH" },
  { prog: "MaxMilhas", acc: ACC.LATAM, date: "2022-12-09", miles: 17719, received: 442.44,  previsto: 442.44,  status: "PAID", desc: "MaxMilhas 7156719 UGEJRX" },
  { prog: "MaxMilhas", acc: ACC.AZUL,  date: "2022-09-06", miles: 91910, received: 1890.59, previsto: 1890.59, status: "PAID", desc: "MaxMilhas 6859599 NBBMTB (TudoAzul)" },
  { prog: "MaxMilhas", acc: ACC.LATAM, date: "2022-08-04", miles: 46632, received: 1155.07, previsto: 1155.07, status: "PAID", desc: "MaxMilhas 6743983 ZQHUEK" },
  { prog: "MaxMilhas", acc: ACC.LATAM, date: "2022-07-23", miles: 43189, received: 1078.43, previsto: 1078.43, status: "PAID", desc: "MaxMilhas 6693022 (localizador CANCELADO, status Recebido)" },
  { prog: "MaxMilhas", acc: ACC.LATAM, date: "2022-06-16", miles: 44689, received: 1206.16, previsto: 1206.16, status: "PAID", desc: "MaxMilhas 6544093 WNUCBU" },
  { prog: "MaxMilhas", acc: ACC.AZUL,  date: "2022-04-04", miles: 58000, received: 1363.00, previsto: 1363.00, status: "PAID", desc: "MaxMilhas 6285436 RN3FKX (TudoAzul)" },
  { prog: "MaxMilhas", acc: ACC.AZUL,  date: "2022-04-03", miles: 64040, received: 1504.94, previsto: 1504.94, status: "PAID", desc: "MaxMilhas 6282277 ECEBXY (TudoAzul)" },
  { prog: "MaxMilhas", acc: ACC.GOL,   date: "2023-03-10", miles: 35800, received: 608.24,  previsto: 608.24,  status: "PAID", desc: "MaxMilhas 7544404 MPSGHH (Smiles)" },
  { prog: "MaxMilhas", acc: ACC.GOL,   date: "2023-02-27", miles: 36800, received: 628.91,  previsto: 628.91,  status: "PAID", desc: "MaxMilhas 7489061 ZFPJKL (Smiles)" },
  { prog: "MaxMilhas", acc: ACC.GOL,   date: "2023-02-27", miles: 35400, received: 604.99,  previsto: 604.99,  status: "PAID", desc: "MaxMilhas 7486464 HTIWER (Smiles)" },
  { prog: "MaxMilhas", acc: ACC.GOL,   date: "2023-02-21", miles: 31300, received: 534.92,  previsto: 534.92,  status: "PAID", desc: "MaxMilhas 7465203 TAXSAP (Smiles)" },
  { prog: "MaxMilhas", acc: ACC.GOL,   date: "2023-02-21", miles: 51200, received: 875.01,  previsto: 875.01,  status: "PAID", desc: "MaxMilhas 7464552 SLVEFG (Smiles)" },

  // BANKMILHAS (pacote) - Finalizado=PAID, Desistencia=CANCELLED
  { prog: "Bankmilhas", acc: ACC.LATAM, date: "2024-11-25", miles: 102000, received: 2448.00, previsto: 2448.00, status: "PAID",      desc: "Bankmilhas 79093" },
  { prog: "Bankmilhas", acc: ACC.LATAM, date: "2024-07-26", miles: 196000, received: 4508.00, previsto: 4508.00, status: "PAID",      desc: "Bankmilhas 69704" },
  { prog: "Bankmilhas", acc: ACC.LATAM, date: "2024-07-05", miles: 0,      received: 0,       previsto: 0,       status: "CANCELLED", desc: "Bankmilhas 67992 (desistencia, R$2300 nao concretizado)" },
  { prog: "Bankmilhas", acc: ACC.LATAM, date: "2023-10-10", miles: 161000, received: 3542.00, previsto: 3542.00, status: "PAID",      desc: "Bankmilhas 45604" },

  // HOTMILHAS (pacote) - 2 pendentes (recuperacao judicial) = PENDING
  { prog: "Hotmilhas", acc: ACC.GOL,   date: "2023-08-12", miles: 201000, received: 0,       previsto: 3730.60, status: "PENDING", desc: "Hotmilhas 9754292 (recjud, Smiles)" },
  { prog: "Hotmilhas", acc: ACC.GOL,   date: "2023-07-14", miles: 76000,  received: 0,       previsto: 1399.11, status: "PENDING", desc: "Hotmilhas 9693941 (recjud, Smiles)" },
  { prog: "Hotmilhas", acc: ACC.LATAM, date: "2022-11-12", miles: 57000,  received: 1539.06, previsto: 1539.06, status: "PAID", desc: "Hotmilhas 9072462 (Latam)" },
  { prog: "Hotmilhas", acc: ACC.LATAM, date: "2022-10-14", miles: 157000, received: 4499.58, previsto: 4499.58, status: "PAID", desc: "Hotmilhas 8940675 (Latam)" },
  { prog: "Hotmilhas", acc: ACC.GOL,   date: "2022-10-01", miles: 87000,  received: 1668.28, previsto: 1668.28, status: "PAID", desc: "Hotmilhas 8892732 (Smiles)" },
  { prog: "Hotmilhas", acc: ACC.LATAM, date: "2022-08-28", miles: 125000, received: 3625.20, previsto: 3625.20, status: "PAID", desc: "Hotmilhas 8823643 (Latam)" },
  { prog: "Hotmilhas", acc: ACC.GOL,   date: "2022-04-26", miles: 30000,  received: 567.00,  previsto: 567.00,  status: "PAID", desc: "Hotmilhas 8540661 (Smiles)" },
];

// resolve program ids
const programs = await prisma.$queryRawUnsafe(
  `SELECT id, name FROM "Company" WHERE type = 'SALE'`
);
const progId = {};
for (const p of programs) progId[p.name] = p.id;
for (const s of sales) {
  if (!progId[s.prog]) throw new Error(`Programa nao encontrado: ${s.prog} (rode a migration de seed primeiro)`);
}

// insere (idempotente por description)
let inserted = 0, skipped = 0;
for (const s of sales) {
  const exists = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Transaction" WHERE type = 'SALE' AND description = $1 LIMIT 1`,
    s.desc
  );
  if (exists.length) { skipped++; continue; }
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Transaction"
       ("type","date","miles","accountId","saleProgramId","received","previsto","saleStatus","description","createdAt","updatedAt")
     VALUES ('SALE'::"TransactionType", $1::timestamp, $2, $3, $4, $5, $6, $7::"SaleStatus", $8, NOW(), NOW())`,
    s.date, s.miles, s.acc, progId[s.prog], s.received, s.previsto, s.status, s.desc
  );
  inserted++;
}
console.log(`inseridas: ${inserted}, ja existentes: ${skipped}`);

// recalcula costBasis das vendas (replay cronologico por conta airline) — SQL cru,
// para funcionar mesmo com @prisma/client desatualizado (sem o enum SALE gerado)
for (const accountId of [ACC.LATAM, ACC.AZUL, ACC.GOL]) {
  const transactions = await prisma.$queryRawUnsafe(
    `SELECT id, type::text AS type, miles, "milesTo", "averagePrice",
            "averagePriceTransfer", "milesBuy", "accountId", "accountToId"
       FROM "Transaction"
      WHERE "accountId" = $1 OR "accountToId" = $1
      ORDER BY date ASC, type ASC, id ASC`,
    accountId
  );
  let miles = 0, averagePrice = 0;
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.type == "BUY" || t.type == "MEMBERSHIP" || t.type == "PARTNER") {
      if (i == 0) { miles = t.miles; averagePrice = t.averagePrice; }
      else { if (t.miles > 0) averagePrice = (averagePrice*miles + t.averagePrice*t.miles)/(t.miles+miles); miles += t.miles; }
      if (miles < 0) miles = 0;
    } else if (t.type == "FLIGHT" || t.type == "EXPIRE") { miles -= t.miles; if (miles<0) miles=0; }
    else if (t.type == "TRANSFER") {
      if (t.accountId == accountId) { miles -= t.miles; if (miles<0) miles=0; }
      else { if (t.miles>0) averagePrice=(averagePrice*miles + t.averagePriceTransfer*t.miles)/(t.milesTo+miles); miles += t.milesTo; if (miles<0) miles=0; }
    } else if (t.type == "TRANSFER_BUY") {
      if (t.accountId == accountId) { averagePrice=(averagePrice*miles + t.averagePrice*t.milesBuy)/(t.milesBuy+miles); miles += t.milesBuy; miles -= t.miles + t.milesBuy; if (miles<0) miles=0; }
      else { if (t.miles>0) averagePrice=(averagePrice*miles + t.averagePriceTransfer*(t.miles+t.milesBuy))/(t.milesTo+miles); miles += t.milesTo; if (miles<0) miles=0; }
    } else if (t.type == "SALE") {
      if (t.accountId == accountId) {
        const cb = (t.miles * averagePrice) / 1000;
        await prisma.$executeRawUnsafe(`UPDATE "Transaction" SET "costBasis" = $1 WHERE id = $2`, cb, t.id);
      }
    }
  }
}
console.log("costBasis recalculado para contas Latam/Azul/Gol");
await prisma.$disconnect();
