import { Request, Response } from "express";
import { usuarioService } from "../services/usuario.service";
import { lerId } from "../utils/lerId";

export const usuarioController = {
  listar: (req: Request, res: Response) => {
    res.json(usuarioService.listar());
  },
  buscarPorId: (req: Request, res: Response) => {
    res.json(usuarioService.buscarPorId(lerId(req)));
  },
  criar: (req: Request, res: Response) => {
    res.status(201).json(usuarioService.criar(req.body)); // req.body já validado pelo Zod
  },
  atualizar: (req: Request, res: Response) => {
    res.json(usuarioService.atualizar(lerId(req), req.body));
  },
  remover: (req: Request, res: Response) => {
    usuarioService.remover(lerId(req), req.usuario!.id);
    res.status(204).send();
  },
};
