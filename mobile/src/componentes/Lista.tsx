import { useCallback, useState, type ReactNode } from "react";
import { Alert, FlatList, Platform, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ErroApi } from "../servicos/api";
import { Botao, Carregando, MensagemErro, cores, estilos } from "./ui";

// Pergunta "tem certeza?" — Alert no celular, window.confirm no navegador
export function confirmar(titulo: string, mensagem: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((resolve) =>
    Alert.alert(titulo, mensagem, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Excluir", style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}

export function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === "web") window.alert(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}

type ListaProps<T extends { id: number }> = {
  caminho: string; // ex.: "/categorias"
  consulta?: string; // filtros da listagem, ex.: "status=pendente"
  rotuloNovo: string;
  aoCriar: () => void;
  aoEditar: (item: T) => void;
  nomeDoItem: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  vazio: string;
};

// Lista genérica: carrega da API, atualiza ao voltar para a tela, puxa para atualizar e exclui
export function ListaCrud<T extends { id: number }>(props: ListaProps<T>) {
  const [itens, setItens] = useState<T[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const url = props.consulta ? `${props.caminho}?${props.consulta}` : props.caminho;
      setItens(await api.get<T[]>(url));
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Erro ao carregar");
      setItens((atual) => atual ?? []);
    }
  }, [props.caminho, props.consulta]);

  // Recarrega sempre que a tela volta a ficar visível (ex.: depois de salvar um item)
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  async function excluir(item: T) {
    const ok = await confirmar("Excluir", `Deseja excluir "${props.nomeDoItem(item)}"?`);
    if (!ok) return;
    try {
      await api.delete(`${props.caminho}/${item.id}`);
      await carregar();
    } catch (e) {
      avisar("Não foi possível excluir", e instanceof ErroApi ? e.message : "Erro inesperado");
    }
  }

  if (itens === null) return <Carregando />;

  return (
    <FlatList
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      data={itens}
      keyExtractor={(item) => String(item.id)}
      refreshing={atualizando}
      onRefresh={async () => {
        setAtualizando(true);
        await carregar();
        setAtualizando(false);
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <MensagemErro texto={erro} />
          <Botao titulo={`+ ${props.rotuloNovo}`} onPress={props.aoCriar} />
        </View>
      }
      ListEmptyComponent={<Text style={[estilos.textoSuave, { textAlign: "center", marginTop: 24 }]}>{props.vazio}</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => props.aoEditar(item)}
          style={({ pressed }) => [estilos.cartao, pressed && { backgroundColor: cores.primariaClara }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>{props.renderItem(item)}</View>
            <Botao titulo="Excluir" variante="perigo" pequeno onPress={() => void excluir(item)} />
          </View>
        </Pressable>
      )}
    />
  );
}
