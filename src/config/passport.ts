import passport from 'passport';
import type { Profile } from 'passport';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import AppleStrategy from 'passport-apple';
import type { AuthProvider } from '@prisma/client';
import { env } from './env.js';
import { findOrCreateUserFromOAuth } from '../services/auth.service.js';

type VerifyDone = (error: unknown, user?: Express.User | false) => void;

/// Callback compartilhado pelas estratégias OAuth "clássicas" (Google, Facebook,
/// GitHub): mapeia o perfil do provedor para o nosso usuário e o entrega ao
/// Passport. Evita duplicação (DRY) entre esses provedores.
function buildVerify(provider: AuthProvider) {
  return async (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyDone,
  ): Promise<void> => {
    try {
      const user = await findOrCreateUserFromOAuth({
        provider,
        providerAccountId: profile.id,
        name: profile.displayName || profile.username || 'Usuário',
        email: profile.emails?.[0]?.value,
        photoUrl: profile.photos?.[0]?.value,
      });
      done(null, { id: user.id });
    } catch (error) {
      done(error);
    }
  };
}

function callbackURL(provider: string): string {
  return `${env.baseUrl}/auth/${provider}/callback`;
}

interface AppleIdTokenClaims {
  sub: string;
  email?: string;
}

interface AppleRequestUser {
  name?: { firstName?: string; lastName?: string };
}

type AppleVerifyDone = (error?: Error | null, user?: Express.User) => void;

/// O `id_token` da Apple é um JWT já validado pela própria estratégia; aqui só
/// extraímos os claims que nos interessam (identificador e e-mail).
function decodeAppleIdToken(idToken: string): AppleIdTokenClaims {
  const claims = jwt.decode(idToken);
  if (claims === null || typeof claims === 'string') {
    throw new Error('id_token inválido recebido da Apple.');
  }
  return claims as AppleIdTokenClaims;
}

/// A Apple só envia o nome do usuário no primeiro login, como JSON no corpo do
/// POST de callback. Nas vezes seguintes restam apenas os claims do id_token.
function appleNameFromRequest(req: Request): string | undefined {
  const raw = (req.body as { user?: unknown }).user;
  if (typeof raw !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as AppleRequestUser;
    const fullName = [parsed.name?.firstName, parsed.name?.lastName]
      .filter((part): part is string => Boolean(part))
      .join(' ');
    return fullName || undefined;
  } catch {
    return undefined;
  }
}

/// Verify dedicado da Apple: o perfil vem vazio e os dados do usuário estão no
/// id_token (e, no primeiro login, no corpo da requisição). Por isso não usa o
/// `buildVerify` compartilhado.
async function appleVerify(
  req: Request,
  _accessToken: string,
  _refreshToken: string,
  idToken: string,
  _profile: Record<string, unknown>,
  done: AppleVerifyDone,
): Promise<void> {
  try {
    const claims = decodeAppleIdToken(idToken);
    const user = await findOrCreateUserFromOAuth({
      provider: 'APPLE',
      providerAccountId: claims.sub,
      name: appleNameFromRequest(req) ?? 'Usuário',
      email: claims.email,
    });
    done(null, { id: user.id });
  } catch (error) {
    done(error instanceof Error ? error : new Error('Falha no login com a Apple.'));
  }
}

/// Registra cada estratégia apenas se as credenciais correspondentes existirem.
/// Assim, o servidor sobe mesmo com parte dos provedores ainda não configurada.
export function configurePassport(): void {
  const { google, facebook, github, apple } = env.oauth;

  if (google.clientID && google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: google.clientID,
          clientSecret: google.clientSecret,
          callbackURL: callbackURL('google'),
          scope: ['profile', 'email'],
        },
        buildVerify('GOOGLE'),
      ),
    );
  }

  if (facebook.clientID && facebook.clientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: facebook.clientID,
          clientSecret: facebook.clientSecret,
          callbackURL: callbackURL('facebook'),
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        buildVerify('FACEBOOK'),
      ),
    );
  }

  if (github.clientID && github.clientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: github.clientID,
          clientSecret: github.clientSecret,
          callbackURL: callbackURL('github'),
          scope: ['user:email'],
        },
        buildVerify('GITHUB'),
      ),
    );
  }

  if (apple.clientID && apple.teamID && apple.keyID && apple.privateKey) {
    passport.use(
      new AppleStrategy(
        {
          clientID: apple.clientID,
          teamID: apple.teamID,
          keyID: apple.keyID,
          privateKeyString: apple.privateKey,
          callbackURL: callbackURL('apple'),
          passReqToCallback: true,
        },
        appleVerify,
      ),
    );
  }
}

/// Provedores efetivamente habilitados (com credenciais presentes).
export function enabledProviders(): string[] {
  const { google, facebook, github, apple } = env.oauth;
  const providers: string[] = [];
  if (google.clientID) providers.push('google');
  if (facebook.clientID) providers.push('facebook');
  if (github.clientID) providers.push('github');
  if (apple.clientID) providers.push('apple');
  return providers;
}
