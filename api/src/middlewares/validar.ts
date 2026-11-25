import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

// zod: valida req.body antes de chegar na controller.
export function validar(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({ erros: resultado.error.issues });
    }
    req.body = resultado.data; // dados já validados (e com defaults aplicados)
    next();
  };
}
