import passport from 'passport';
import type { Profile } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
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

/// Registra cada estratégia apenas se as credenciais correspondentes existirem.
/// Assim, o servidor sobe mesmo com parte dos provedores ainda não configurada.
export function configurePassport(): void {
  const { google, facebook, github } = env.oauth;

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
}

/// Provedores efetivamente habilitados (com credenciais presentes).
export function enabledProviders(): string[] {
  const { google, facebook, github } = env.oauth;
  const providers: string[] = [];
  if (google.clientID) providers.push('google');
  if (facebook.clientID) providers.push('facebook');
  if (github.clientID) providers.push('github');
  return providers;
}
