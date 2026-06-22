// Aumenta os tipos do Express para carregar o usuário autenticado na requisição.
declare global {
  namespace Express {
    interface User {
      id: string;
    }
    interface Request {
      // Preenchido pelo authMiddleware após validar o JWT.
      userId?: string;
    }
  }
}

export {};
