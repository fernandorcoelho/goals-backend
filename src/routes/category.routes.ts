import { Router } from 'express';
import {
  create,
  createTask,
  destroy,
  destroyTask,
  index,
  show,
  update,
  updateTask,
} from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../lib/async-handler.js';

export const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);

categoryRoutes.get('/', asyncHandler(index));
categoryRoutes.post('/', asyncHandler(create));
categoryRoutes.get('/:id', asyncHandler(show));
categoryRoutes.patch('/:id', asyncHandler(update));
categoryRoutes.delete('/:id', asyncHandler(destroy));

categoryRoutes.post('/:id/tasks', asyncHandler(createTask));
categoryRoutes.patch('/:id/tasks/:taskId', asyncHandler(updateTask));
categoryRoutes.delete('/:id/tasks/:taskId', asyncHandler(destroyTask));
