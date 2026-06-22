/// Erro de aplicação que carrega um status HTTP. Os controllers e middlewares
/// traduzem isso para a resposta. Services lançam HttpError em vez de conhecer
/// detalhes de transporte (req/res).
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message: string) => new HttpError(404, message);
export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message: string) => new HttpError(401, message);
export const conflict = (message: string) => new HttpError(409, message);
