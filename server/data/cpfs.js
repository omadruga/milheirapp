import prisma from "./prisma";

export async function getCpfs() {
  const cpfs = await prisma.cpf.findMany();
  return cpfs;
}

export async function createCpf(name, cpf) {
  try {
    return await prisma.cpf.create({
      data: {
        name,
        cpf,
      },
    });
  } catch (err) {
    throw createError({
      statusCode: 422,
      message: "CPF já está sendo usado.",
      data: {
        statusCode: err.response?.status,
        responseBody: err.data,
      },
    });
  }
}

export async function updateCpf(id, name, cpf) {
  return await prisma.cpf.update({
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
  const result = await prisma.cpf.delete({
    where: {
      id,
    },
  });
  return result;
}
