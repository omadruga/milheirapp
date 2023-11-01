import prisma from "./prisma";
import { Prisma } from "@prisma/client";
import { useDayjs } from "#dayjs";
import { updateAccountMilePrice } from "./accounts";

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

    calculate(account);
    if (accountTo) {
      calculate(accountTo);
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

    calculate(account);
    if (accountTo) {
      calculate(accountTo);
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
  calculate(result.accountId);
  if (result.accountToId) {
    calculate(result.accountToId);
  }
  return result;
}

async function calculate(accountId) {
  const dayjs = useDayjs();

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
  var cpfs = 0;

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
          (averagePrice * miles +
            t.averagePriceTransfer * (t.miles + t.milesBuy)) /
          (t.milesTo + miles);
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
    }

    // calculation of CPFs
    if (t.account.company.type == "AIRLINE") {
      var start = null;
      switch (t.account.company.name) {
        case "Latam": {
          // 24 cpfs + próprio
          // cada cpf consome uma vaga por 366 dias
          start = dayjs().subtract(366, "day");
          break;
        }
        case "Gol": {
          // 25 cpfs + próprio
          // ano calendário, janeiro zera
          start = dayjs().startOf("year");
          break;
        }
      }
      if (start) {
        if (dayjs(t.date).isAfter(start)) {
          if (t.cpfs && t.cpfs > 0) {
            cpfs += t.cpfs;
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
          if (dayjs(t.expire).isBefore(expire)) {
            expire = t.expire;
          }
        } else {
          expire = t.expire;
        }
      }
    }
  }

  console.log(
    "END miles=" + miles + ", price=" + averagePrice + ", cpfs=" + cpfs
  );
  if (miles == 0) {
    averagePrice = 0;
  }
  updateAccountMilePrice(accountId, miles, averagePrice);
}
