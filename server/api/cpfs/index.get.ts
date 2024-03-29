import { getCpfs } from "~/server/data/cpfs";

export default defineEventHandler(async (event) => {
  const params = getQuery(event);
  const q = params.q;
  return await getCpfs(q?.toLowerCase());
});
