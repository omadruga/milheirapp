import { createCompany, updateCompany } from "../../data/companies.js";
export default defineEventHandler(async (event) => {
  const { id, name, icon, type } = await readBody(event);
  if (id) {
    return updateCompany(id, name, icon, type);
  }
  return createCompany(name, icon, type);
});
