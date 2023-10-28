import { getCpfs } from "~/server/data/cpfs";

export default defineEventHandler(async () => {
  return await getCpfs();
});
