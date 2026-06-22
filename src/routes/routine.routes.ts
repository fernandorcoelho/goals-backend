import { Router } from 'express';
import { clear, setDay, show } from '../controllers/routine.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';

export const routineRoutes = Router();

routineRoutes.use(authMiddleware);

routineRoutes.get('/', asyncHandler(show));
// weekday usa o enum em maiúsculas: MONDAY..SUNDAY.
routineRoutes.put('/days/:weekday', asyncHandler(setDay));
routineRoutes.delete('/days/:weekday', asyncHandler(clear));
