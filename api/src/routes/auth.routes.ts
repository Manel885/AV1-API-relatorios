import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/autenticar";
import { validar } from "../middlewares/validar";
import { criarUsuarioSchema, loginSchema } from "../schemas/usuario.schema";

export const authRouter = Router();

authRouter.post("/registrar", validar(criarUsuarioSchema), authController.registrar);
authRouter.post("/login", validar(loginSchema), authController.login);
authRouter.get("/me", autenticar, authController.eu);
