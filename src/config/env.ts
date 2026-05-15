import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || "development",
  API_URI_PREFIX: process.env.API_URI_PREFIX,
  DATABASE_URL: process.env.DATABASE_URL || "",
  DATABASE_POOL_URL: process.env.DATABASE_POOL_URL || "",
};
