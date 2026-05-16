import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  API_URI_PREFIX: process.env.API_URI_PREFIX || "api/v1",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "24h",
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "noreply@example.com",
  API_URL: process.env.API_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
};
