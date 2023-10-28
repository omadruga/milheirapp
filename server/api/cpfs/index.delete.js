import { deleteCpf } from "../../data/cpfs.js";
export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const result = deleteCpf(id);
  return result;
});
