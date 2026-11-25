import { NextFunction, Request, Response } from "express";
import { authService, type UsuarioToken } from "../services/auth.service";

// Deixa o TypeScript saber que req.usuario existe depois deste middleware
declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

// JWT: exige o cabeçalho "Authorization: Bearer <token>"
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  try {
    req.usuario = authService.verificarToken(token);
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}
