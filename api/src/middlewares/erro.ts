import { NextFunction, Request, Response } from "express";
import { ErroHttp } from "../errors/ErroHttp";

export function tratadorDeErros(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ erro: err.message });
  }

  // JSON malformado no corpo da requisição (erro do express.json())
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
}
