import { getAccounts } from "~/server/data/accounts";

export default defineEventHandler(async () => {
  return await getAccounts();
});
