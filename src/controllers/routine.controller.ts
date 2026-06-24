import type { Request, Response } from 'express';
import { requireUserId } from '../middlewares/auth.middleware.js';
import { getOrCreateRoutine } from '../services/routine.service.js';

export async function show(req: Request, res: Response): Promise<void> {
  const routine = await getOrCreateRoutine(requireUserId(req));
  res.json(routine);
}
