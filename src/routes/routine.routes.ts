import { Router } from 'express';
import { show } from '../controllers/routine.controller.js';
import { create, destroy, update } from '../controllers/task.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';

export const routineRoutes = Router();

routineRoutes.use(authMiddleware);

routineRoutes.get('/', asyncHandler(show));

// weekday usa o enum em maiúsculas: MONDAY..SUNDAY.
routineRoutes.post('/days/:weekday/tasks', asyncHandler(create));

routineRoutes.patch('/tasks/:id', asyncHandler(update));
routineRoutes.delete('/tasks/:id', asyncHandler(destroy));
