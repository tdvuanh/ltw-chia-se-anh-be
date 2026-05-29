import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Configure testing environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-that-is-long-enough-for-jwt-signing";
process.env.JWT_EXPIRY = "1h";
process.env.DATABASE_POOL_URL = "postgresql://localhost:5432/test";
process.env.PORT = "3000";

// Mock Nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-email-id" }),
  }),
}));

// Create and export deep mock for Prisma
export const prismaMock = mockDeep<any>();

jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
