import type { NextFunction, Request, Response } from 'express';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/// Encaminha rejeições de handlers async ao middleware de erro do Express, que
/// na versão 4 não captura promises rejeitadas automaticamente.
export function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}
