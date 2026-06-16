import { getTransactions } from "~/server/data/transactions";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const transactions = await getTransactions();
  return transactions;
});
