import type { Request, Response } from 'express';
import { signToken } from '../lib/jwt.js';
import { env } from '../config/env.js';
import { unauthorized } from '../errors/http-error.js';

/// Conclui o fluxo OAuth: o Passport já validou o provedor e populou `req.user`.
/// Emitimos um JWT próprio e respondemos em JSON ou redirecionamos ao front com
/// o token na query, conforme a configuração.
export function oauthCallback(req: Request, res: Response): void {
  const user = req.user;

  if (!user) {
    throw unauthorized('Falha na autenticação com o provedor.');
  }

  const token = signToken(user.id);

  if (env.frontendSuccessUrl) {
    const url = new URL(env.frontendSuccessUrl);
    url.searchParams.set('token', token);
    res.redirect(url.toString());
    return;
  }

  res.json({ token, tokenType: 'Bearer' });
}
