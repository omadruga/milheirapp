import { deleteCompany } from "../../data/companies.js";
export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const result = deleteCompany(id);
  return result;
});
