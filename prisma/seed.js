import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  await prisma.company.createMany({
    data: [
      {
        name: "Livelo",
        type: "PROGRAM",
        icon: "https://www.livelo.com.br/file/v7222028718893574664/general/favicon.livelop-new.png",
      },
      {
        name: "C6 Átomos",
        type: "PROGRAM",
        icon: "https://www.c6bank.com.br/icon.png",
      },
      {
        name: "Azul",
        type: "AIRLINE",
        icon: "https://www.voeazul.com.br/etc.clientlibs/azul/clientlibs/clientlib-react/resources/favicon.ico",
      },
      {
        name: "Gol",
        type: "AIRLINE",
        icon: "https://www.voegol.com.br/themes/custom/gol_theme/voegol-favicon.ico",
      },
      {
        name: "Latam",
        type: "AIRLINE",
        icon: "https://s.latamairlines.com/images/seo/favicon.ico",
      },
      {
        name: "TAP",
        type: "AIRLINE",
        icon: "https://www.flytap.com/assets/images/favicon.ico?v=1.0.0",
      },
    ],
  });
  await prisma.cpf.createMany({
    data: [
      { name: "Gustavo", cpf: "056.013.119-43" },
      { name: "Jaqueline", cpf: "057.274.369-66" },
    ],
  });
  const jaqueLivelo = await prisma.account.create({
    data: {
      company: { connect: { id: 1 } },
      cpf: { connect: { id: 2 } },
    },
  });
  const jaqueAzul = await prisma.account.create({
    data: {
      company: { connect: { id: 3 } },
      cpf: { connect: { id: 2 } },
    },
  });
  const jaqueGol = await prisma.account.create({
    data: {
      company: { connect: { id: 4 } },
      cpf: { connect: { id: 2 } },
    },
  });
  const guLivelo = await prisma.account.create({
    data: {
      company: { connect: { id: 1 } },
      cpf: { connect: { id: 1 } },
    },
  });
  const guAzul = await prisma.account.create({
    data: {
      company: { connect: { id: 3 } },
      cpf: { connect: { id: 1 } },
    },
  });
  const guGol = await prisma.account.create({
    data: {
      company: { connect: { id: 4 } },
      cpf: { connect: { id: 1 } },
    },
  });
  await prisma.transaction.createMany({
    data: [
      // JAQUE
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-04-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "PARTNER",
        accountId: jaqueLivelo.id,
        date: new Date("2022-05-04"),
        miles: 41,
        averagePrice: 0,
      },
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-05-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-06-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "PARTNER",
        accountId: jaqueLivelo.id,
        date: new Date("2022-06-21"),
        miles: 9000,
        averagePrice: 0,
      },
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-07-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "BUY",
        accountId: jaqueLivelo.id,
        date: new Date("2022-07-21"),
        miles: 15000,
        cost: 525,
        averagePrice: (525 / 15000) * 1000,
      },
      {
        type: "PARTNER",
        accountId: jaqueLivelo.id,
        date: new Date("2022-08-12"),
        miles: 263,
        averagePrice: 0,
      },
      {
        type: "TRANSFER",
        accountId: jaqueLivelo.id,
        accountToId: jaqueAzul.id,
        date: new Date("2022-08-15"),
        miles: 59000,
        milesTo: 100300,
        averagePrice: 0,
      },
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-08-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "PARTNER",
        accountId: jaqueLivelo.id,
        date: new Date("2022-09-17"),
        miles: 418,
        averagePrice: 0,
      },
      {
        type: "MEMBERSHIP",
        accountId: jaqueLivelo.id,
        date: new Date("2022-09-21"),
        miles: 12000,
        cost: 489.9,
        averagePrice: (489.9 / 12000) * 1000,
      },
      {
        type: "PARTNER",
        accountId: jaqueLivelo.id,
        date: new Date("2022-09-21"),
        miles: 9000,
        averagePrice: 0,
      },

      // GU
      {
        type: "MEMBERSHIP",
        accountId: guLivelo.id,
        date: new Date("2022-03-25"),
        miles: 1000,
        cost: 41.9,
        averagePrice: (41.9 / 1000) * 1000,
      },
      {
        type: "BUY",
        accountId: guLivelo.id,
        date: new Date("2022-03-25"),
        miles: 14000,
        cost: 588,
        averagePrice: (588 / 14000) * 1000,
      },
    ],
  });
}

try {
  await seed();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
