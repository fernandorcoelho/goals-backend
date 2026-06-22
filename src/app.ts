import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { authRoutes } from './routes/auth.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { categoryRoutes } from './routes/category.routes.js';
import { routineRoutes } from './routes/routine.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  configurePassport();

  const app = express();

  app.use(cors());
  app.use(express.json());
  // A Apple devolve o callback como POST em form-urlencoded (response_mode=form_post).
  app.use(express.urlencoded({ extended: false }));
  app.use(passport.initialize());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/me', profileRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/routine', routineRoutes);

  // Middleware de erro deve ser o último registrado.
  app.use(errorMiddleware);

  return app;
}
