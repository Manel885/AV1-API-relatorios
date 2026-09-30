import { ErroHttp } from "../errors/ErroHttp";
import { categoriaRepository } from "../repositories/categoria.repository";
import { relatorioRepository } from "../repositories/relatorio.repository";
import type { CriarCategoriaDTO } from "../schemas/categoria.schema";

export const categoriaService = {
  listar: () => categoriaRepository.listar(),

  buscarPorId: (id: number) => {
    const categoria = categoriaRepository.buscarPorId(id);
    if (!categoria) throw new ErroHttp(404, "Categoria não encontrada");
    return categoria;
  },

  criar: (dados: CriarCategoriaDTO) => categoriaRepository.criar(dados),

  atualizar: (id: number, dados: CriarCategoriaDTO) => {
    const categoria = categoriaRepository.atualizar(id, dados);
    if (!categoria) throw new ErroHttp(404, "Categoria não encontrada");
    return categoria;
  },

  remover: (id: number) => {
    categoriaService.buscarPorId(id); // 404 se não existe
    // Regra de negócio: não apaga categoria que ainda tem relatórios (409 = conflito)
    if (relatorioRepository.contarPorCategoria(id) > 0) {
      throw new ErroHttp(409, "Categoria em uso: existem relatórios vinculados a ela");
    }
    categoriaRepository.remover(id);
  },
};
