import { ErroHttp } from "../errors/ErroHttp";
import { destinatarioRepository } from "../repositories/destinatario.repository";
import { relatorioRepository } from "../repositories/relatorio.repository";
import type { CriarDestinatarioDTO } from "../schemas/destinatario.schema";

export const destinatarioService = {
  listar: () => destinatarioRepository.listar(),

  buscarPorId: (id: number) => {
    const destinatario = destinatarioRepository.buscarPorId(id);
    if (!destinatario) throw new ErroHttp(404, "Destinatário não encontrado");
    return destinatario;
  },

  criar: (dados: CriarDestinatarioDTO) => destinatarioRepository.criar(dados),

  atualizar: (id: number, dados: CriarDestinatarioDTO) => {
    const destinatario = destinatarioRepository.atualizar(id, dados);
    if (!destinatario) throw new ErroHttp(404, "Destinatário não encontrado");
    return destinatario;
  },

  remover: (id: number) => {
    destinatarioService.buscarPorId(id);
    if (relatorioRepository.contarPorDestinatario(id) > 0) {
      throw new ErroHttp(409, "Destinatário em uso: existem relatórios vinculados a ele");
    }
    destinatarioRepository.remover(id);
  },
};
