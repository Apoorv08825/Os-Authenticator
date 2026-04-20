import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export const generateAccessToken = (payload) => {
  const jwtId = randomUUID();
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: jwtId
  });

  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;

  return { token, jwtId, expiresAt };
};

export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
