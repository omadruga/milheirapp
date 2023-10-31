import { getDashboard } from "~/server/data/dashboard";

export default defineEventHandler(async (event) => {
  return await getDashboard();
});
