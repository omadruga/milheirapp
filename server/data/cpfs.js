import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getCpfs(q) {
  if (!q) return await prisma.Cpf.findMany();
  return await prisma.Cpf.findMany({
    where: {
      OR: [
        {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          cpf: {
            contains: q,
          },
        },
      ],
    },
  });
}

export async function createCpf(name, cpf) {
  try {
    return await prisma.Cpf.create({
      data: {
        name,
        cpf,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw createError({
        statusCode: 422,
        message: "CPF já está sendo usado.",
        data: {
          statusCode: e.response?.status,
          responseBody: e.data,
        },
      });
    }
    throw e;
  }
}

export async function updateCpf(id, name, cpf) {
  return await prisma.Cpf.update({
    where: {
      id,
    },
    data: {
      name,
      cpf,
    },
  });
}

export async function deleteCpf(id) {
  const result = await prisma.Cpf.delete({
    where: {
      id,
    },
  });
  return result;
}
