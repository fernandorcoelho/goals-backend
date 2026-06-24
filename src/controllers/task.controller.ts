import type { Request, Response } from 'express';
import { z } from 'zod';
import { Weekday } from '@prisma/client';
import { requireUserId } from '../middlewares/auth.middleware.js';
import { addTask, deleteTask, renameTask, setTasksCompletion } from '../services/task.service.js';

const weekdaySchema = z.nativeEnum(Weekday);

const nameSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();

const completionSchema = z
  .object({
    tasks: z
      .array(z.object({ id: z.string().uuid(), completed: z.boolean() }).strict())
      .min(1),
  })
  .strict();

export async function create(req: Request, res: Response): Promise<void> {
  const weekday = weekdaySchema.parse(req.params.weekday);
  const { name } = nameSchema.parse(req.body);
  const task = await addTask(requireUserId(req), weekday, name);
  res.status(201).json(task);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { name } = nameSchema.parse(req.body);
  const task = await renameTask(requireUserId(req), req.params.id, name);
  res.json(task);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  await deleteTask(requireUserId(req), req.params.id);
  res.status(204).send();
}

export async function updateCompletion(req: Request, res: Response): Promise<void> {
  const { tasks } = completionSchema.parse(req.body);
  const updated = await setTasksCompletion(requireUserId(req), tasks);
  res.json(updated);
}
