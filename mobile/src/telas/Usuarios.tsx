import { useState } from "react";
import { Text } from "react-native";
import { useAuth } from "../contexto/AuthContext";
import { ListaCrud } from "../componentes/Lista";
import { useFormulario } from "../componentes/useFormulario";
import { Botao, Campo, Carregando, Etiqueta, MensagemErro, Tela, estilos } from "../componentes/ui";
import { registroSchema, textoOuUndefined, usuarioEdicaoSchema } from "../schemas";
import { api } from "../servicos/api";
import type { Usuario } from "../tipos";
import type { PropsTela } from "../navegacao";

export function UsuariosTela({ navigation }: PropsTela<"Usuarios">) {
  const { usuario: logado } = useAuth();
  return (
    <ListaCrud<Usuario>
      caminho="/usuarios"
      rotuloNovo="Novo usuário"
      vazio="Nenhum usuário"
      aoCriar={() => navigation.navigate("UsuarioForm", {})}
      aoEditar={(u) => navigation.navigate("UsuarioForm", { id: u.id })}
      nomeDoItem={(u) => u.nome}
      renderItem={(u) => (
        <>
          <Text style={estilos.titulo}>{u.nome}</Text>
          <Text style={estilos.textoSuave}>{u.email}</Text>
          {u.id === logado?.id ? <Etiqueta texto="Você" tipo="neutro" /> : null}
        </>
      )}
    />
  );
}

export function UsuarioFormTela({ navigation, route }: PropsTela<"UsuarioForm">) {
  const id = route.params?.id;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const form = useFormulario({
    // No cadastro a senha é obrigatória; na edição, opcional
    schema: id ? usuarioEdicaoSchema : registroSchema,
    carregar: id
      ? async () => {
          const u = await api.get<Usuario>(`/usuarios/${id}`);
          setNome(u.nome);
          setEmail(u.email);
        }
      : undefined,
    enviar: async (dados) => {
      if (id) await api.put(`/usuarios/${id}`, dados);
      else await api.post("/usuarios", dados);
      navigation.goBack();
    },
  });

  if (form.carregando) return <Carregando />;

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
      <Campo
        rotulo={id ? "Nova senha (deixe vazio para manter)" : "Senha"}
        value={senha}
        onChangeText={setSenha}
        erro={form.erros.senha}
        secureTextEntry
      />
      <Botao
        titulo={id ? "Salvar alterações" : "Cadastrar"}
        carregando={form.salvando}
        onPress={() => form.salvar({ nome, email, senha: id ? textoOuUndefined(senha) : senha })}
      />
    </Tela>
  );
}
