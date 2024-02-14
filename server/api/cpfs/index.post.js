import { createCpf, updateCpf } from "../../data/cpfs.js";
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { id, name, cpf } = await readBody(event);
  if (id) {
    return updateCpf(id, name, cpf);
  }
  return createCpf(name, cpf);
});
