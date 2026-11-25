import bcrypt from "bcryptjs";
import { ErroHttp } from "../errors/ErroHttp";
import { usuarioRepository } from "../repositories/usuario.repository";
import type { AtualizarUsuarioDTO, CriarUsuarioDTO } from "../schemas/usuario.schema";

const RODADAS_BCRYPT = 10;

// Regra de negócio: e-mail único (ignorando maiúsculas/minúsculas)
function garantirEmailLivre(email: string, idAtual?: number) {
  const existente = usuarioRepository.buscarPorEmailComSenha(email);
  if (existente && existente.id !== idAtual) {
    throw new ErroHttp(409, "Já existe um usuário com esse e-mail");
  }
}

export const usuarioService = {
  listar: () => usuarioRepository.listar(),

  buscarPorId: (id: number) => {
    const usuario = usuarioRepository.buscarPorId(id);
    if (!usuario) throw new ErroHttp(404, "Usuário não encontrado");
    return usuario;
  },

  criar: (dados: CriarUsuarioDTO) => {
    const email = dados.email.toLowerCase();
    garantirEmailLivre(email);
    // A senha nunca é salva como texto: guardamos só o hash (bcrypt)
    const senhaHash = bcrypt.hashSync(dados.senha, RODADAS_BCRYPT);
    return usuarioRepository.criar(dados.nome, email, senhaHash);
  },

  atualizar: (id: number, dados: AtualizarUsuarioDTO) => {
    const hashAtual = usuarioRepository.buscarHashDaSenha(id);
    if (!hashAtual) throw new ErroHttp(404, "Usuário não encontrado");

    const email = dados.email.toLowerCase();
    garantirEmailLivre(email, id);
    const senhaHash = dados.senha ? bcrypt.hashSync(dados.senha, RODADAS_BCRYPT) : hashAtual;
    return usuarioRepository.atualizar(id, dados.nome, email, senhaHash)!;
  },

  remover: (id: number, idLogado: number) => {
    usuarioService.buscarPorId(id); // 404 se não existe
    if (id === idLogado) {
      throw new ErroHttp(409, "Você não pode excluir o próprio usuário");
    }
    usuarioRepository.remover(id);
  },
};
