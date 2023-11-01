import { getTransactions } from "~/server/data/transactions";

export default defineEventHandler(async (event) => {
  const params = getQuery(event);
  const type = params.type;
  const account = params.account;
  if (type || account) {
    var where = {};
    if (type) {
      where.type = type;
    }
    if (account) {
      where.accountId = parseInt(account);
    }
    console.log("getTransactions where=" + JSON.stringify(where));
    return await getTransactions(where);
  }
  console.log("getTransactions");
  return await getTransactions();
});
