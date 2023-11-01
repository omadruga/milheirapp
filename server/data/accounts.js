import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getAccounts() {
  return await prisma.Account.findMany({
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
  });
}

export async function createAccount(
  cpf,
  company,
  miles,
  averageMilePrice,
  seats,
  seatsUsed
) {
  try {
    return await prisma.Account.create({
      data: {
        cpf: { connect: { id: cpf } },
        company: { connect: { id: company } },
        miles: miles ? parseFloat(miles) : 0.0,
        averageMilePrice: averageMilePrice ? parseFloat(averageMilePrice) : 0.0,
        seats,
        seatsUsed,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw createError({
        statusCode: 422,
        message: "Já existe a Empresa cadastrada nesse CPF.",
        data: {
          statusCode: e.response?.status,
          responseBody: e.data,
        },
      });
    }
    throw createError({
      statusCode: e.statusCode,
      message: "Erro ao cadastrar Conta",
      data: {
        statusCode: e.response?.status,
        responseBody: e.data,
      },
    });
  }
}

export async function updateAccount(
  id,
  cpf,
  company,
  miles,
  averageMilePrice,
  seats,
  seatsUsed
) {
  return await prisma.Account.update({
    where: {
      id,
    },
    data: {
      cpf: { connect: { id: cpf } },
      company: { connect: { id: company } },
      miles: miles ? parseFloat(miles) : 0.0,
      averageMilePrice: averageMilePrice ? parseFloat(averageMilePrice) : 0.0,
      seats,
      seatsUsed,
    },
  });
}

export async function updateAccountMilePrice(id, miles, averageMilePrice) {
  await prisma.Account.update({
    where: {
      id,
    },
    data: {
      miles,
      averageMilePrice,
    },
  });
}

export async function updateAccountMilePriceSeats(
  id,
  miles,
  averageMilePrice,
  seats,
  seatsUsed
) {
  await prisma.Account.update({
    where: {
      id,
    },
    data: {
      miles,
      averageMilePrice,
      seats,
      seatsUsed,
    },
  });
}

export async function deleteAccount(id) {
  const result = await prisma.Account.delete({
    where: {
      id,
    },
  });
  return result;
}
