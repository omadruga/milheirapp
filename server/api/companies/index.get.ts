import { getCompanies } from "~/server/data/companies";

export default defineEventHandler(async (event) => {
  const params = getQuery(event);
  const q = params.q;
  return await getCompanies(q?.toLowerCase());
});
