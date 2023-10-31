import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getDashboard() {
  const data = await prisma.Cpf.findMany({
    include: {
      accounts: {
        include: {
          company: {
            select: {
              type: true,
              name: true,
              icon: true,
            },
          },
          transactions: true,
          transactionsTo: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
  return data;
}
