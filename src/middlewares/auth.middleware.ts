import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { unauthorized } from '../errors/http-error.js';

/// Exige um JWT válido no header `Authorization: Bearer <token>` e disponibiliza
/// o id do usuário em `req.userId`.
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Token de autenticação ausente.'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized('Token de autenticação inválido ou expirado.'));
  }
}

/// Lê o id do usuário garantido pelo authMiddleware. Usar dentro de rotas
/// protegidas evita repetir a checagem de presença.
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw unauthorized('Requisição não autenticada.');
  }
  return req.userId;
}
