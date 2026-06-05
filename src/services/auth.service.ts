import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { generateRandomToken, generateTokenExpiry } from "../utils/token";
import { generateAccessToken } from "./token.service";
import {
  sendEmail,
  generateVerificationEmailHtml,
  generatePasswordResetEmailHtml,
} from "./email.service";
import { ENV } from "../config/env";

export async function registerUser(
  username: string,
  email: string,
  password: string,
  full_name?: string,
) {
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    const field = existingUser.email === email ? "email" : "username";
    throw {
      status: 409,
      message: `User with this ${field} already exists`,
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      username,
      email,
      password_hash: hashedPassword,
      full_name: full_name || null,
    },
  });

  const verificationToken = generateRandomToken();
  const expiresAt = generateTokenExpiry(24 * 60);

  await prisma.email_verification_tokens.create({
    data: {
      user_id: user.id,
      token: verificationToken,
      expires_at: expiresAt,
    },
  });

  const verificationLink = `${ENV.API_URL}/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: generateVerificationEmailHtml(verificationLink),
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.full_name,
    message:
      "Registration successful. Please check your email to verify your account.",
  };
}

export async function verifyEmail(token: string) {
  const verificationRecord = await prisma.email_verification_tokens.findUnique({
    where: { token },
  });

  if (!verificationRecord) {
    throw {
      status: 404,
      message: "Invalid verification token",
    };
  }

  if (new Date() > verificationRecord.expires_at) {
    throw {
      status: 410,
      message: "Verification token has expired",
    };
  }

  await prisma.users.update({
    where: { id: verificationRecord.user_id },
    data: { email_verified: true },
  });

  await prisma.email_verification_tokens.delete({
    where: { token },
  });

  return {
    message: "Email verified successfully",
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    throw {
      status: 401,
      message: "Invalid email or password",
    };
  }

  if (user.status === "banned") {
    throw {
      status: 403,
      message: "Your account has been banned",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw {
      status: 401,
      message: "Invalid email or password",
    };
  }

  if (!user.email_verified) {
    throw {
      status: 403,
      message: "Please verify your email before logging in",
    };
  }

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    },
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.users.findUnique({
    where: { email },
  });

  console.log("forgotPassword", { user });

  if (!user) {
    throw {
      status: 404,
      message: "User not found",
    };
  }

  const resetToken = generateRandomToken();
  const expiresAt = generateTokenExpiry(15);

  await prisma.password_reset_tokens.create({
    data: {
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
    },
  });

  const resetLink = `${ENV.API_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: generatePasswordResetEmailHtml(resetLink),
  });

  return {
    message: "Password reset link has been sent to your email",
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetRecord = await prisma.password_reset_tokens.findUnique({
    where: { token },
  });

  if (!resetRecord) {
    throw {
      status: 404,
      message: "Invalid reset token",
    };
  }

  if (new Date() > resetRecord.expires_at) {
    throw {
      status: 410,
      message: "Reset token has expired",
    };
  }

  if (resetRecord.used_at) {
    throw {
      status: 410,
      message: "Reset token has already been used",
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { id: resetRecord.user_id },
    data: {
      password_hash: hashedPassword,
      last_password_changed_at: new Date(),
    },
  });

  await prisma.password_reset_tokens.update({
    where: { id: resetRecord.id },
    data: { used_at: new Date() },
  });

  return {
    message: "Password reset successfully",
  };
}
