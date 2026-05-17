import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_POOL_URL!,
});

// Helper function to convert BigInt to string recursively
function serializeBigInt(data: any): any {
  if (typeof data === "bigint") {
    return data.toString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeBigInt);
  }

  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeBigInt(value)]),
    );
  }

  return data;
}

const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);

        return serializeBigInt(result);
      },
    },
  },
});

export default prisma;
