import prisma from "./prisma";

function serializeBigInt(data: any): any {
  console.log("Serializing data:", data);
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

// Middleware to serialize bigint to string
prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args);
        console.log("Query result before serialization:", result);
        return serializeBigInt(result);
      },
    },
  },
});
