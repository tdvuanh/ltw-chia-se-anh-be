import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { JwtPayload } from "../types";

export function generateAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRY,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
