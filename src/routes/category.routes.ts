import { Router } from 'express';
import {
  create,
  createItem,
  destroy,
  destroyItem,
  index,
  show,
  update,
  updateItem,
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

categoryRoutes.post('/:id/items', asyncHandler(createItem));
categoryRoutes.patch('/:id/items/:itemId', asyncHandler(updateItem));
categoryRoutes.delete('/:id/items/:itemId', asyncHandler(destroyItem));
