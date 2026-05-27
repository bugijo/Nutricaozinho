import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Envolve handlers async para encaminhar erros ao middleware central.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Erro de domínio com status HTTP explícito.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Middleware central de tratamento de erros.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Dados inválidos', details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Erros conhecidos do Prisma: mensagens amigáveis, sem vazar detalhes internos.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Registro não encontrado.' });
      case 'P2003':
        return res.status(409).json({
          error: 'Não foi possível concluir: este registro está em uso ou faz referência a algo que não existe.',
        });
      case 'P2002':
        return res.status(409).json({ error: 'Já existe um registro com esses dados.' });
      default:
        return res.status(400).json({ error: 'Não foi possível processar a solicitação no banco de dados.' });
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Dados inválidos para o banco de dados.' });
  }
  if (err instanceof Error) {
    // Erros lançados pelos services (validações de domínio) viram 400.
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
