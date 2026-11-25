import { Router } from "express";
import { usuarioController } from "../controllers/usuario.controller";
import { validar } from "../middlewares/validar";
import { atualizarUsuarioSchema, criarUsuarioSchema } from "../schemas/usuario.schema";

export const usuarioRouter = Router();

usuarioRouter.get("/", usuarioController.listar);
usuarioRouter.get("/:id", usuarioController.buscarPorId);
usuarioRouter.post("/", validar(criarUsuarioSchema), usuarioController.criar);
usuarioRouter.put("/:id", validar(atualizarUsuarioSchema), usuarioController.atualizar);
usuarioRouter.delete("/:id", usuarioController.remover);
