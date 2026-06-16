import { getCompanies } from "~/server/data/companies";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const params = getQuery(event);
  const q = params.q;
  return await getCompanies(q?.toLowerCase());
});
