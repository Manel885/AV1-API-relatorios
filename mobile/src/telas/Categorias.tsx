import { useState } from "react";
import { Text } from "react-native";
import { ListaCrud } from "../componentes/Lista";
import { useFormulario } from "../componentes/useFormulario";
import { Botao, Campo, Carregando, MensagemErro, Tela, estilos } from "../componentes/ui";
import { categoriaSchema, textoOuUndefined } from "../schemas";
import { api } from "../servicos/api";
import type { Categoria } from "../tipos";
import type { PropsTela } from "../navegacao";

export function CategoriasTela({ navigation }: PropsTela<"Categorias">) {
  return (
    <ListaCrud<Categoria>
      caminho="/categorias"
      rotuloNovo="Nova categoria"
      vazio="Nenhuma categoria cadastrada"
      aoCriar={() => navigation.navigate("CategoriaForm", {})}
      aoEditar={(c) => navigation.navigate("CategoriaForm", { id: c.id })}
      nomeDoItem={(c) => c.nome}
      renderItem={(c) => (
        <>
          <Text style={estilos.titulo}>{c.nome}</Text>
          {c.descricao ? <Text style={estilos.textoSuave}>{c.descricao}</Text> : null}
        </>
      )}
    />
  );
}

export function CategoriaFormTela({ navigation, route }: PropsTela<"CategoriaForm">) {
  const id = route.params?.id;
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const form = useFormulario({
    schema: categoriaSchema,
    carregar: id
      ? async () => {
          const c = await api.get<Categoria>(`/categorias/${id}`);
          setNome(c.nome);
          setDescricao(c.descricao ?? "");
        }
      : undefined,
    enviar: async (dados) => {
      if (id) await api.put(`/categorias/${id}`, dados);
      else await api.post("/categorias", dados);
      navigation.goBack();
    },
  });

  if (form.carregando) return <Carregando />;

  return (
    <Tela>
      <MensagemErro texto={form.erroGeral} />
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} erro={form.erros.nome} />
      <Campo
        rotulo="Descrição (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        erro={form.erros.descricao}
        multiline
      />
      <Botao
        titulo={id ? "Salvar alterações" : "Cadastrar"}
        carregando={form.salvando}
        onPress={() => form.salvar({ nome, descricao: textoOuUndefined(descricao) })}
      />
    </Tela>
  );
}
