import { Router } from "express";
import { relatorioController } from "../controllers/relatorio.controller";
import { validar } from "../middlewares/validar";
import { criarRelatorioSchema } from "../schemas/relatorio.schema";

export const relatorioRouter = Router();

relatorioRouter.get("/", relatorioController.listar);
relatorioRouter.get("/:id", relatorioController.buscarPorId);
relatorioRouter.post("/", validar(criarRelatorioSchema), relatorioController.criar);
relatorioRouter.put("/:id", validar(criarRelatorioSchema), relatorioController.atualizar);
relatorioRouter.delete("/:id", relatorioController.remover);
