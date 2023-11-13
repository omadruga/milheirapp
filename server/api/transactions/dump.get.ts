import { getTransactions } from "~/server/data/transactions";

export default defineEventHandler(async (event) => {
  console.log("dump");
  const transactions = await getTransactions();
  return transactions;
});
