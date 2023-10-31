import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getTransactions() {
  return await prisma.Transaction.findMany({
    include: {
      account: {
        include: {
          cpf: {
            select: {
              name: true,
              cpf: true,
            },
          },
          company: {
            select: {
              name: true,
              icon: true,
            },
          },
        },
      },
      accountTo: {
        include: {
          cpf: {
            select: {
              name: true,
              cpf: true,
            },
          },
          company: {
            select: {
              name: true,
              icon: true,
            },
          },
        },
      },
    },
  });
}

export async function createTransaction(data, account, accountTo) {
  data.account = { connect: { id: account } };
  if (accountTo) {
    data.accountTo = { connect: { id: accountTo } };
  }

  try {
    return await prisma.Transaction.create({
      data: data,
    });
  } catch (e) {
    console.log(e);
    throw createError({
      statusCode: e.statusCode,
      message: "Erro ao cadastrar Transação",
      data: {
        statusCode: e.response?.status,
        responseBody: e.data,
      },
    });
  }
}

export async function updateTransaction(id, data, account, accountTo) {
  data.account = { connect: { id: account } };
  if (accountTo) {
    data.accountTo = { connect: { id: accountTo } };
  }

  try {
    return await prisma.Transaction.update({
      where: {
        id,
      },
      data,
    });
  } catch (e) {
    console.log(e);
    throw createError({
      statusCode: e.statusCode,
      message: "Erro ao cadastrar Transação",
      data: {
        statusCode: e.response?.status,
        responseBody: e.data,
      },
    });
  }
}

export async function deleteTransaction(id) {
  const result = await prisma.Transaction.delete({
    where: {
      id,
    },
  });
  return result;
}
