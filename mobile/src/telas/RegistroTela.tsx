import { useState } from "react";
import { useAuth } from "../contexto/AuthContext";
import { useFormulario } from "../componentes/useFormulario";
import { Botao, Campo, MensagemErro, Tela } from "../componentes/ui";
import { registroSchema } from "../schemas";

export function RegistroTela() {
  const { registrar } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Ao registrar, a API já devolve o token e o app entra direto
  const form = useFormulario({
    schema: registroSchema,
    enviar: (d) => registrar(d.nome, d.email, d.senha),
  });

  return (
    <Tela>
      <MensagemErro texto={form.erroGeral} />
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} erro={form.erros.nome} />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={form.erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} erro={form.erros.senha} secureTextEntry />
      <Botao
        titulo="Criar conta"
        carregando={form.salvando}
        onPress={() => form.salvar({ nome, email, senha })}
      />
    </Tela>
  );
}
