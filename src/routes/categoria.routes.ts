import { Router } from "express";
import { categoriaController } from "../controllers/categoria.controller";
import { validar } from "../middlewares/validar";
import { criarCategoriaSchema } from "../schemas/categoria.schema";

export const categoriaRouter = Router();

categoriaRouter.get("/", categoriaController.listar);
categoriaRouter.get("/:id", categoriaController.buscarPorId);
categoriaRouter.post("/", validar(criarCategoriaSchema), categoriaController.criar);
categoriaRouter.put("/:id", validar(criarCategoriaSchema), categoriaController.atualizar);
categoriaRouter.delete("/:id", categoriaController.remover);
