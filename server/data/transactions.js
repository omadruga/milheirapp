import prisma from "./prisma";
import { Prisma } from "@prisma/client";
import {
  updateAccountMilePrice,
  updateAccountMilePriceSeats,
} from "./accounts";

export async function getTransactions(where) {
  const include = {
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
  };
  if (where) {
    return await prisma.Transaction.findMany({
      include,
      where,
      orderBy: [{ date: "desc" }],
    });
  }
  return await prisma.Transaction.findMany({
    include,
    orderBy: [{ date: "desc" }],
  });
}

export async function createTransaction(data, account, accountTo) {
  data.account = { connect: { id: account } };
  if (accountTo) {
    data.accountTo = { connect: { id: accountTo } };
  }

  try {
    const result = await prisma.Transaction.create({
      data: data,
    });

    await calculate(account);
    if (accountTo) {
      await calculate(accountTo);
    }

    return result;
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
    const result = await prisma.Transaction.update({
      where: {
        id,
      },
      data,
    });

    await calculate(account);
    if (accountTo) {
      await calculate(accountTo);
    }

    return result;
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

export async function updateSaleCostBasis(id, costBasis) {
  try {
    return await prisma.Transaction.update({
      where: { id },
      data: { costBasis },
    });
  } catch (e) {
    console.log(e);
  }
}

export async function updateAveragePriceTransfer(id, price) {
  try {
    const result = await prisma.Transaction.update({
      where: {
        id,
      },
      data: {
        averagePriceTransfer: price,
      },
    });
    return result;
  } catch (e) {
    console.log(e);
    throw createError({
      statusCode: e.statusCode,
      message: "Erro ao updateAveragePriceTransfer",
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
  await calculate(result.accountId);
  if (result.accountToId) {
    await calculate(result.accountToId);
  }
  return result;
}

async function calculate(accountId) {
  const account = await prisma.Account.findUnique({
    where: { id: accountId },
    include: { company: { select: { type: true } } },
  });
  if (!account) return;
  const companyType = account.company.type;

  const transactions = await prisma.Transaction.findMany({
    include: {
      account: {
        include: {
          company: {
            select: {
              type: true,
              name: true,
            },
          },
        },
      },
      accountTo: true,
    },
    where: {
      OR: [
        {
          account: {
            id: accountId,
          },
        },
        {
          accountTo: {
            id: accountId,
          },
        },
      ],
    },
    orderBy: [{ date: "asc" }, { type: "asc" }, { id: "asc" }],
  });

  var miles = 0;
  var averagePrice = 0;
  var expire = null;
  var seats = 0;
  var seatsUsed = 0;

  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];

    // calculation of miles and price
    if (t.type == "BUY" || t.type == "MEMBERSHIP" || t.type == "PARTNER") {
      if (i == 0) {
        miles = t.miles;
        averagePrice = t.averagePrice;
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles + t.averagePrice * t.miles) /
            (t.miles + miles);
        }
        miles += t.miles;
      }
      if (miles < 0) {
        miles = 0;
      }
    } else if (t.type == "FLIGHT" || t.type == "EXPIRE") {
      miles -= t.miles;
      if (miles < 0) {
        miles = 0;
      }
    } else if (t.type == "TRANSFER") {
      // nos estamos enviando
      if (t.accountId == accountId) {
        // atualizado preço médio na transfer
        updateAveragePriceTransfer(t.id, averagePrice);

        // depois envia
        miles -= t.miles;
        if (miles < 0) {
          miles = 0;
        }
        // nos estamos recebendo
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles + t.averagePriceTransfer * t.miles) /
            (t.milesTo + miles);
        }
        miles += t.milesTo;
        if (miles < 0) {
          miles = 0;
        }
      }
    } else if (t.type == "TRANSFER_BUY") {
      // nos estamos enviando
      if (t.accountId == accountId) {
        // primeiro compra
        averagePrice =
          (averagePrice * miles + t.averagePrice * t.milesBuy) /
          (t.milesBuy + miles);
        miles += t.milesBuy;
        updateAveragePriceTransfer(t.id, averagePrice);

        // depois envia
        miles -= t.miles + t.milesBuy;
        if (miles < 0) {
          miles = 0;
        }
        // nos estamos recebendo
      } else {
        if (t.miles > 0) {
          averagePrice =
            (averagePrice * miles +
              t.averagePriceTransfer * (t.miles + t.milesBuy)) /
            (t.milesTo + miles);
        }
        miles += t.milesTo;
        if (miles < 0) {
          miles = 0;
        }
      }
    } else if (t.type == "SALE") {
      // venda de milhas: as milhas já saíram via emissão (FLIGHT), então NÃO
      // altera saldo nem CPFs aqui. Apenas registra o custo das milhas vendidas
      // com o preço médio corrente, para o cálculo de lucro no dashboard.
      if (t.accountId == accountId) {
        updateSaleCostBasis(t.id, (t.miles * averagePrice) / 1000);
      }
    }

    // calculation of CPFs
    if (t.account.company.type == "AIRLINE") {
      var startMs = null;
      switch (t.account.company.name) {
        case "Latam": {
          // 25 cpfs + próprio
          // cada cpf consome uma vaga por 365 dias; no dia 366 é liberada
          seats = 25;
          const s = new Date();
          s.setHours(0, 0, 0, 0);
          s.setDate(s.getDate() - 365);
          startMs = s.getTime();
          break;
        }
        case "Gol": {
          // 25 cpfs + próprio
          // ano calendário, janeiro zera
          seats = 25;
          const s = new Date();
          s.setMonth(0, 1);
          s.setHours(0, 0, 0, 0);
          startMs = s.getTime();
          break;
        }
      }
      if (startMs != null && t.type == "FLIGHT") {
        const tDay = new Date(t.date);
        tDay.setHours(0, 0, 0, 0);
        if (tDay.getTime() > startMs) {
          if (t.cpfs && t.cpfs > 0) {
            seatsUsed += t.cpfs;
          }
        }
      }
    }

    // calculation of first expire
    if (miles == 0) {
      expire = null;
    } else {
      if (t.expire) {
        if (expire) {
          if (new Date(t.expire).getTime() < new Date(expire).getTime()) {
            expire = t.expire;
          }
        } else {
          expire = t.expire;
        }
      }
    }
  }

  if (miles == 0) {
    averagePrice = 0;
  }
  console.log("[calc DONE]", {
    accountId,
    companyType,
    seats,
    seatsUsed,
  });
  if (companyType == "PROGRAM") {
    await updateAccountMilePrice(accountId, miles, averagePrice);
  } else if (companyType == "AIRLINE") {
    await updateAccountMilePriceSeats(
      accountId,
      miles,
      averagePrice,
      seats,
      seatsUsed
    );
  }
}
