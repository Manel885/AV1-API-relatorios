import { ErroHttp } from "../errors/ErroHttp";
import { categoriaRepository } from "../repositories/categoria.repository";
import { destinatarioRepository } from "../repositories/destinatario.repository";
import { relatorioRepository } from "../repositories/relatorio.repository";
import type { CriarRelatorioDTO } from "../schemas/relatorio.schema";

function garantirVinculos(dados: CriarRelatorioDTO) {
  if (!categoriaRepository.buscarPorId(dados.categoriaId)) {
    throw new ErroHttp(400, `categoriaId ${dados.categoriaId} não existe`);
  }
  if (!destinatarioRepository.buscarPorId(dados.destinatarioId)) {
    throw new ErroHttp(400, `destinatarioId ${dados.destinatarioId} não existe`);
  }
}

export const relatorioService = {
  listar: (status?: "pendente" | "enviado") => relatorioRepository.listar(status),

  buscarPorId: (id: number) => {
    const relatorio = relatorioRepository.buscarPorId(id);
    if (!relatorio) throw new ErroHttp(404, "Relatório não encontrado");
    return relatorio;
  },

  criar: (dados: CriarRelatorioDTO) => {
    garantirVinculos(dados);
    return relatorioRepository.criar(dados);
  },

  atualizar: (id: number, dados: CriarRelatorioDTO) => {
    relatorioService.buscarPorId(id); // 404 se não existe
    garantirVinculos(dados);
    return relatorioRepository.atualizar(id, dados)!;
  },

  remover: (id: number) => {
    relatorioService.buscarPorId(id);
    relatorioRepository.remover(id);
  },
};
