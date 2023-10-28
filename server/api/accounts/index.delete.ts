import { deleteAccount } from "../../data/accounts.js";
export default defineEventHandler(async (event: any) => {
  const { id } = await readBody(event);
  const result = deleteAccount(id);
  return result;
});
