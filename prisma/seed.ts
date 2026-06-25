import bcrypt from "bcrypt";
import prisma from "../src/config/prisma";

const SALT_ROUNDS = 10;

const seedUsers = [
  {
    username: "admin",
    email: "admin@example.com",
    password: "Admin@123",
    full_name: "Admin User",
    role: "admin" as const,
  },
  {
    username: "testuser",
    email: "user@example.com",
    password: "User@123",
    full_name: "Test User",
    role: "user" as const,
  },
];

async function main() {
  console.log("Seeding users...\n");

  for (const seedUser of seedUsers) {
    const password_hash = await bcrypt.hash(seedUser.password, SALT_ROUNDS);

    await prisma.users.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        username: seedUser.username,
        email: seedUser.email,
        password_hash,
        full_name: seedUser.full_name,
        role: seedUser.role,
        email_verified: true,
      },
    });

    console.log(`[${seedUser.role.toUpperCase()}] email: ${seedUser.email} | password: ${seedUser.password}`);
  }

  console.log("\nSeeding completed.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
