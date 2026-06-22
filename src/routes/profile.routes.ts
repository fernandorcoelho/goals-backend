import { Router } from 'express';
import { getMe, updateMe } from '../controllers/profile.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';

export const profileRoutes = Router();

profileRoutes.use(authMiddleware);
profileRoutes.get('/', asyncHandler(getMe));
profileRoutes.patch('/', asyncHandler(updateMe));
