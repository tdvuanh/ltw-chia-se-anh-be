import prisma from "./database";

// Middleware to serialize bigint to string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$use(async (params: any, next: any) => {
  const result = await next(params);

  if (result && typeof result === "object") {
    if ("id" in result && typeof result.id === "bigint") {
      result.id = result.id.toString();
    }
    if ("user_id" in result && typeof result.user_id === "bigint") {
      result.user_id = result.user_id.toString();
    }
  }

  return result;
});
