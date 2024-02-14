import { createAccount, updateAccount } from "../../data/accounts.js";

export default defineEventHandler(async (event: any) => {
  const session = await requireUserSession(event);
  const { id, cpf, company, miles, averageMilePrice, seats, seatsUsed } =
    await readBody(event);
  if (id) {
    return updateAccount(
      id,
      cpf,
      company,
      miles,
      averageMilePrice,
      seats,
      seatsUsed
    );
  }
  return createAccount(cpf, company, miles, averageMilePrice, seats, seatsUsed);
});
