import { getTransactions } from "~/server/data/transactions";

export default defineEventHandler(async () => {
  return await getTransactions();
});
