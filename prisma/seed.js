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
}

try {
  await seed();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
