import { getAccounts } from "~/server/data/accounts";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  return await getAccounts();
});
