import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getCompanies(q) {
  if (!q) return await prisma.Company.findMany();
  return await prisma.Company.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    orderBy: {
      type: "desc",
      name: "asc",
    },
  });
}

export async function createCompany(name, icon, type) {
  try {
    return await prisma.Company.create({
      data: {
        name,
        icon,
        type,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw createError({
        statusCode: 422,
        message: "Empresa já está sendo usado.",
        data: {
          statusCode: e.response?.status,
          responseBody: e.data,
        },
      });
    }
    throw e;
  }
}

export async function updateCompany(id, name, icon, type) {
  return await prisma.Company.update({
    where: {
      id,
    },
    data: {
      name,
      icon,
      type,
    },
  });
}

export async function deleteCompany(id) {
  const result = await prisma.Company.delete({
    where: {
      id,
    },
  });
  return result;
}
