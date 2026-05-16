import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_POOL_URL!,
});

const prisma = new PrismaClient({ adapter });

// Helper function to convert BigInt to string recursively
const convertBigInt = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }

  if (obj && typeof obj === "object") {
    const converted: any = {};
    for (const key in obj) {
      if (typeof obj[key] === "bigint") {
        converted[key] = obj[key].toString();
      } else if (typeof obj[key] === "object") {
        converted[key] = convertBigInt(obj[key]);
      } else {
        converted[key] = obj[key];
      }
    }
    return converted;
  }

  return obj;
};

// Apply middleware to serialize BigInt values
prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);
        return convertBigInt(result);
      },
    },
  },
});

export { prisma };
export default prisma;
