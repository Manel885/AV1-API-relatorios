import { Router } from "express";
import { destinatarioController } from "../controllers/destinatario.controller";
import { validar } from "../middlewares/validar";
import { criarDestinatarioSchema } from "../schemas/destinatario.schema";

export const destinatarioRouter = Router();

destinatarioRouter.get("/", destinatarioController.listar);
destinatarioRouter.get("/:id", destinatarioController.buscarPorId);
destinatarioRouter.post("/", validar(criarDestinatarioSchema), destinatarioController.criar);
destinatarioRouter.put("/:id", validar(criarDestinatarioSchema), destinatarioController.atualizar);
destinatarioRouter.delete("/:id", destinatarioController.remover);
