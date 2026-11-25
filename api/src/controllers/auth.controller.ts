import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  registrar: (req: Request, res: Response) => {
    res.status(201).json(authService.registrar(req.body));
  },
  login: (req: Request, res: Response) => {
    res.json(authService.login(req.body));
  },
  // Quem é o dono do token (preenchido pelo middleware autenticar)
  eu: (req: Request, res: Response) => {
    res.json(req.usuario);
  },
};
