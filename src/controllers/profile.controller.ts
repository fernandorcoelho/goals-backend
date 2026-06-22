import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireUserId } from '../middlewares/auth.middleware.js';
import { getProfile, updateProfile } from '../services/profile.service.js';

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    nickname: z.string().trim().min(1).max(60).optional(),
    photoUrl: z.string().url().max(2048).optional(),
  })
  .strict();

export async function getMe(req: Request, res: Response): Promise<void> {
  const profile = await getProfile(requireUserId(req));
  res.json(profile);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const data = updateProfileSchema.parse(req.body);
  const profile = await updateProfile(requireUserId(req), data);
  res.json(profile);
}
