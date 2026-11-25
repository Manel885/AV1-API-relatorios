import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ErroHttp } from "../errors/ErroHttp";
import { usuarioRepository, type Usuario } from "../repositories/usuario.repository";
import type { CriarUsuarioDTO, LoginDTO } from "../schemas/usuario.schema";
import { usuarioService } from "./usuario.service";

// Dados guardados dentro do token (o id vai no "sub", padrão do JWT)
export type UsuarioToken = { id: number; nome: string; email: string };

function gerarToken(usuario: Usuario): string {
  return jwt.sign({ nome: usuario.nome, email: usuario.email }, config.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: config.jwtExpiraEm as jwt.SignOptions["expiresIn"],
  });
}

export const authService = {
  // Cria a conta e já devolve o token (o app entra direto)
  registrar: (dados: CriarUsuarioDTO) => {
    const usuario = usuarioService.criar(dados);
    return { token: gerarToken(usuario), usuario };
  },

  login: (dados: LoginDTO) => {
    const linha = usuarioRepository.buscarPorEmailComSenha(dados.email.toLowerCase());
    // Mesma mensagem para e-mail ou senha errados (não revela qual dos dois falhou)
    if (!linha || !bcrypt.compareSync(dados.senha, linha.senha_hash)) {
      throw new ErroHttp(401, "E-mail ou senha inválidos");
    }
    const usuario = usuarioRepository.buscarPorId(linha.id)!;
    return { token: gerarToken(usuario), usuario };
  },

  // Confere assinatura e validade; lança erro se o token for inválido/expirado
  verificarToken: (token: string): UsuarioToken => {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    return { id: Number(payload.sub), nome: payload.nome, email: payload.email };
  },
};
