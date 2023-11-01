import { Transaction } from "@prisma/client";
import {
  createTransaction,
  updateTransaction,
} from "../../data/transactions.js";

export default defineEventHandler(async (event: any) => {
  const {
    id,
    type,
    account,
    accountTo,
    date,
    miles,
    milesTo,
    cost,
    expire,
    cpfs,
    milesBuy,
    description,
  } = await readBody(event);

  var accTo = null;

  var data: Transaction = {
    type,
    date,
    description,
  };

  data.miles = miles ? parseFloat(miles) : 0.0;

  if (type == "BUY" || type == "MEMBERSHIP") {
    accTo = null;
    data.milesTo = null;
    data.cost = cost ? parseFloat(cost) : 0.0;
    data.expire = expire;
    data.averagePrice = (data.cost / data.miles) * 1000;
    data.cpfs = null;
    data.milesBuy = null;
    data.averagePriceTransfer = null;
  } else if (type === "PARTNER") {
    data.milesTo = null;
    data.cost = 0.0;
    data.expire = expire;
    data.averagePrice = 0;
    data.cpfs = null;
    data.milesBuy = null;
    data.averagePriceTransfer = null;
  } else if (type == "TRANSFER") {
    accTo = accountTo;
    data.milesTo = parseFloat(milesTo);
    data.cost = null;
    data.expire = expire;
    data.averagePrice = null;
    data.cpfs = cpfs;
    data.milesBuy = null;
    data.averagePriceTransfer = null;
  } else if (type == "TRANSFER_BUY") {
    accTo = accountTo;
    data.milesTo = parseFloat(milesTo);
    data.cost = parseFloat(cost);
    data.expire = expire;
    data.milesBuy = parseFloat(milesBuy);
    data.averagePrice = (data.cost / data.milesBuy) * 1000;
    data.cpfs = null;
    data.milesBuy = parseFloat(milesBuy);
  } else if (type == "FLIGHT") {
    data.milesTo = null;
    data.cost = null;
    data.expire = null;
    data.averagePrice = null;
    data.cpfs = parseInt(cpfs);
    data.milesBuy = null;
    data.averagePriceTransfer = null;
  } else if (type == "EXPIRE") {
    data.milesTo = null;
    data.cost = null;
    data.expire = null;
    data.averagePrice = null;
    data.cpfs = null;
    data.milesBuy = null;
    data.averagePriceTransfer = null;
  }

  if (id) {
    return updateTransaction(id, data, account, accTo);
  }
  return createTransaction(data, account, accTo);
});
