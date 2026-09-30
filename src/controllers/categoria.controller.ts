import { Request, Response } from "express";
import { categoriaService } from "../services/categoria.service";
import { lerId } from "../utils/lerId";

export const categoriaController = {
  listar: (req: Request, res: Response) => {
    res.json(categoriaService.listar());
  },
  buscarPorId: (req: Request, res: Response) => {
    res.json(categoriaService.buscarPorId(lerId(req)));
  },
  criar: (req: Request, res: Response) => {
    res.status(201).json(categoriaService.criar(req.body)); // req.body já validado pelo Zod
  },
  atualizar: (req: Request, res: Response) => {
    res.json(categoriaService.atualizar(lerId(req), req.body));
  },
  remover: (req: Request, res: Response) => {
    categoriaService.remover(lerId(req));
    res.status(204).send();
  },
};
