import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireUserId } from '../middlewares/auth.middleware.js';
import {
  addItem,
  createCategory,
  deleteCategory,
  deleteItem,
  getCategory,
  listCategories,
  renameCategory,
  renameItem,
} from '../services/category.service.js';

const nameSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();

export async function index(req: Request, res: Response): Promise<void> {
  res.json(await listCategories(requireUserId(req)));
}

export async function show(req: Request, res: Response): Promise<void> {
  const category = await getCategory(requireUserId(req), req.params.id);
  res.json(category);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const category = await createCategory(requireUserId(req), name);
  res.status(201).json(category);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const category = await renameCategory(requireUserId(req), req.params.id, name);
  res.json(category);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  await deleteCategory(requireUserId(req), req.params.id);
  res.status(204).send();
}

export async function createItem(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const item = await addItem(requireUserId(req), req.params.id, name);
  res.status(201).json(item);
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const item = await renameItem(requireUserId(req), req.params.id, req.params.itemId, name);
  res.json(item);
}

export async function destroyItem(req: Request, res: Response): Promise<void> {
  await deleteItem(requireUserId(req), req.params.id, req.params.itemId);
  res.status(204).send();
}
