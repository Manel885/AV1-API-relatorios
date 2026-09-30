import { Request, Response } from "express";
import { destinatarioService } from "../services/destinatario.service";
import { lerId } from "../utils/lerId";

export const destinatarioController = {
  listar: (req: Request, res: Response) => {
    res.json(destinatarioService.listar());
  },
  buscarPorId: (req: Request, res: Response) => {
    res.json(destinatarioService.buscarPorId(lerId(req)));
  },
  criar: (req: Request, res: Response) => {
    res.status(201).json(destinatarioService.criar(req.body));
  },
  atualizar: (req: Request, res: Response) => {
    res.json(destinatarioService.atualizar(lerId(req), req.body));
  },
  remover: (req: Request, res: Response) => {
    destinatarioService.remover(lerId(req));
    res.status(204).send();
  },
};
