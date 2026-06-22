import { Router } from 'express';
import passport from 'passport';
import { oauthCallback } from '../controllers/auth.controller.js';
import { enabledProviders } from '../config/passport.js';
import { asyncHandler } from '../lib/async-handler.js';

export const authRoutes = Router();

// Lista os provedores de login disponíveis (com credenciais configuradas).
authRoutes.get('/providers', (_req, res) => {
  res.json({ providers: enabledProviders() });
});

// Para cada provedor habilitado, registramos o início do fluxo e o callback.
// A rota `/auth/:provider` redireciona ao consentimento; `/auth/:provider/callback`
// finaliza e emite o JWT.
//
// A Apple usa `response_mode=form_post`, então devolve o resultado via POST; os
// demais provedores retornam via GET.
for (const provider of enabledProviders()) {
  authRoutes.get(`/${provider}`, passport.authenticate(provider, { session: false }));

  const registerCallback =
    provider === 'apple' ? authRoutes.post.bind(authRoutes) : authRoutes.get.bind(authRoutes);

  registerCallback(
    `/${provider}/callback`,
    passport.authenticate(provider, { session: false, failureRedirect: '/auth/failure' }),
    asyncHandler(async (req, res) => oauthCallback(req, res)),
  );
}

authRoutes.get('/failure', (_req, res) => {
  res.status(401).json({ error: 'Não foi possível autenticar com o provedor.' });
});
