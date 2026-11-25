import { useState } from "react";
import { Text } from "react-native";
import { ListaCrud } from "../componentes/Lista";
import { useFormulario } from "../componentes/useFormulario";
import { Botao, Campo, Carregando, MensagemErro, Tela, estilos } from "../componentes/ui";
import { destinatarioSchema, textoOuUndefined } from "../schemas";
import { api } from "../servicos/api";
import type { Destinatario } from "../tipos";
import type { PropsTela } from "../navegacao";

export function DestinatariosTela({ navigation }: PropsTela<"Destinatarios">) {
  return (
    <ListaCrud<Destinatario>
      caminho="/destinatarios"
      rotuloNovo="Novo destinatário"
      vazio="Nenhum destinatário cadastrado"
      aoCriar={() => navigation.navigate("DestinatarioForm", {})}
      aoEditar={(d) => navigation.navigate("DestinatarioForm", { id: d.id })}
      nomeDoItem={(d) => d.nome}
      renderItem={(d) => (
        <>
          <Text style={estilos.titulo}>{d.nome}</Text>
          <Text style={estilos.textoSuave}>{d.email}</Text>
          {d.orgao ? <Text style={estilos.textoSuave}>{d.orgao}</Text> : null}
        </>
      )}
    />
  );
}

export function DestinatarioFormTela({ navigation, route }: PropsTela<"DestinatarioForm">) {
  const id = route.params?.id;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [orgao, setOrgao] = useState("");

  const form = useFormulario({
    schema: destinatarioSchema,
    carregar: id
      ? async () => {
          const d = await api.get<Destinatario>(`/destinatarios/${id}`);
          setNome(d.nome);
          setEmail(d.email);
          setOrgao(d.orgao ?? "");
        }
      : undefined,
    enviar: async (dados) => {
      if (id) await api.put(`/destinatarios/${id}`, dados);
      else await api.post("/destinatarios", dados);
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
      <Campo rotulo="Órgão (opcional)" value={orgao} onChangeText={setOrgao} erro={form.erros.orgao} />
      <Botao
        titulo={id ? "Salvar alterações" : "Cadastrar"}
        carregando={form.salvando}
        onPress={() => form.salvar({ nome, email, orgao: textoOuUndefined(orgao) })}
      />
    </Tela>
  );
}
