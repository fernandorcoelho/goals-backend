import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../errors/http-error.js';

/// Middleware central de erros: traduz erros de domínio, validação e Prisma em
/// respostas HTTP consistentes. Mantém os controllers livres de boilerplate.
export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Violação de restrição única (ex.: apelido já em uso).
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'Registro já existe (violação de unicidade).' });
    return;
  }

  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
}
