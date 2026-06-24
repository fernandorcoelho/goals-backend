import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireUserId } from '../middlewares/auth.middleware.js';
import { listCheckIns, setCheckIn } from '../services/check-in.service.js';

const dateSchema = z.string().date();

const bodySchema = z
  .object({ completedTaskIds: z.array(z.string().uuid()) })
  .strict();

export async function index(req: Request, res: Response): Promise<void> {
  const checkIns = await listCheckIns(requireUserId(req));
  res.json(checkIns);
}

export async function upsert(req: Request, res: Response): Promise<void> {
  const date = dateSchema.parse(req.params.date);
  const { completedTaskIds } = bodySchema.parse(req.body);
  const checkIn = await setCheckIn(requireUserId(req), date, completedTaskIds);
  res.json(checkIn);
}
