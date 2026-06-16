import { getDashboard } from "~/server/data/dashboard";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  return await getDashboard();
});
