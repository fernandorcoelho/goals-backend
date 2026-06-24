import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { authRoutes } from './routes/auth.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { routineRoutes } from './routes/routine.routes.js';
import { checkInRoutes } from './routes/check-in.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  configurePassport();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/me', profileRoutes);
  app.use('/routine', routineRoutes);
  app.use('/check-ins', checkInRoutes);

  // Middleware de erro deve ser o último registrado.
  app.use(errorMiddleware);

  return app;
}
