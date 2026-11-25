import { Request, Response } from "express";
import { listarRelatoriosQuerySchema } from "../schemas/relatorio.schema";
import { relatorioService } from "../services/relatorio.service";
import { lerId } from "../utils/lerId";

export const relatorioController = {
  // 1º CRUD: GET /relatorios  ou  GET /relatorios?status=pendente
  listar: (req: Request, res: Response) => {
    const query = listarRelatoriosQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ erros: query.error.issues });
    }
    res.json(relatorioService.listar(query.data.status));
  },
  buscarPorId: (req: Request, res: Response) => {
    res.json(relatorioService.buscarPorId(lerId(req)));
  },
  // 2º CRUD: POST /relatorios
  criar: (req: Request, res: Response) => {
    res.status(201).json(relatorioService.criar(req.body));
  },
  // 3° CRUD: PUT /relatorios/:id
  atualizar: (req: Request, res: Response) => {
    res.json(relatorioService.atualizar(lerId(req), req.body));
  },
  remover: (req: Request, res: Response) => {
    relatorioService.remover(lerId(req));
    res.status(204).send();
  },
};
