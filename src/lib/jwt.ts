import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string; // id do usuário
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.secret) as TokenPayload;
}
