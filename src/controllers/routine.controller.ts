import type { Request, Response } from 'express';
import { z } from 'zod';
import { Weekday } from '@prisma/client';
import { requireUserId } from '../middlewares/auth.middleware.js';
import { clearDay, getOrCreateRoutine, setDayCategories } from '../services/routine.service.js';

const weekdaySchema = z.nativeEnum(Weekday);

const setDaySchema = z
  .object({
    categoryIds: z.array(z.string().uuid()).min(1),
  })
  .strict();

export async function show(req: Request, res: Response): Promise<void> {
  const routine = await getOrCreateRoutine(requireUserId(req));
  res.json(routine);
}

export async function setDay(req: Request, res: Response): Promise<void> {
  const weekday = weekdaySchema.parse(req.params.weekday);
  const { categoryIds } = setDaySchema.parse(req.body);
  const day = await setDayCategories(requireUserId(req), weekday, categoryIds);
  res.json(day);
}

export async function clear(req: Request, res: Response): Promise<void> {
  const weekday = weekdaySchema.parse(req.params.weekday);
  await clearDay(requireUserId(req), weekday);
  res.status(204).send();
}
