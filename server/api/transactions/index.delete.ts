import { deleteTransaction } from "../../data/transactions.js";
export default defineEventHandler(async (event: any) => {
  const session = await requireUserSession(event);
  const { id } = await readBody(event);
  const result = deleteTransaction(id);
  return result;
});
