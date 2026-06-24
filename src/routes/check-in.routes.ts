import { Router } from 'express';
import { index, upsert } from '../controllers/check-in.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';

export const checkInRoutes = Router();

checkInRoutes.use(authMiddleware);

checkInRoutes.get('/', asyncHandler(index));

// date no formato YYYY-MM-DD.
checkInRoutes.put('/:date', asyncHandler(upsert));
