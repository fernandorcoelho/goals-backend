import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireUserId } from '../middlewares/auth.middleware.js';
import {
  addTask,
  createCategory,
  deleteCategory,
  deleteTask,
  getCategory,
  listCategories,
  renameCategory,
  renameTask,
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

export async function createTask(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const task = await addTask(requireUserId(req), req.params.id, name);
  res.status(201).json(task);
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const task = await renameTask(requireUserId(req), req.params.id, req.params.taskId, name);
  res.json(task);
}

export async function destroyTask(req: Request, res: Response): Promise<void> {
  await deleteTask(requireUserId(req), req.params.id, req.params.taskId);
  res.status(204).send();
}
