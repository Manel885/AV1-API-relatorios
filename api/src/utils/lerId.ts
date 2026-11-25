import { Request } from "express";
import { ErroHttp } from "../errors/ErroHttp";

export function lerId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroHttp(400, "id inválido: use um número inteiro positivo");
  }
  return id;
}
