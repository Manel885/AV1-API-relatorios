import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ListaCrud } from "../componentes/Lista";
import { useFormulario } from "../componentes/useFormulario";
import {
  Botao,
  Campo,
  Carregando,
  Etiqueta,
  MensagemErro,
  Seletor,
  Tela,
  estilos,
} from "../componentes/ui";
import { relatorioSchema, textoOuUndefined } from "../schemas";
import { api } from "../servicos/api";
import type { Categoria, Destinatario, Relatorio, StatusRelatorio } from "../tipos";
import type { PropsTela } from "../navegacao";

const FILTROS: { valor: string; rotulo: string }[] = [
  { valor: "", rotulo: "Todos" },
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "enviado", rotulo: "Enviados" },
];

export function RelatoriosTela({ navigation }: PropsTela<"Relatorios">) {
  const [status, setStatus] = useState("");

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Seletor rotulo="Filtrar por status" opcoes={FILTROS} valor={status} onChange={setStatus} />
      </View>
      <ListaCrud<Relatorio>
        caminho="/relatorios"
        consulta={status ? `status=${status}` : undefined}
        rotuloNovo="Novo relatório"
        vazio="Nenhum relatório encontrado"
        aoCriar={() => navigation.navigate("RelatorioForm", {})}
        aoEditar={(r) => navigation.navigate("RelatorioForm", { id: r.id })}
        nomeDoItem={(r) => r.titulo}
        renderItem={(r) => (
          <>
            <Text style={estilos.titulo}>{r.titulo}</Text>
            <Text style={estilos.textoSuave}>
              {r.categoriaNome} · para {r.destinatarioNome}
            </Text>
            <Text style={estilos.textoSuave}>
              {r.arquivo.nome} ({r.arquivo.tamanhoKb} KB)
            </Text>
            <Etiqueta
              texto={r.status === "enviado" ? "Enviado" : "Pendente"}
              tipo={r.status === "enviado" ? "sucesso" : "alerta"}
            />
          </>
        )}
      />
    </View>
  );
}

export function RelatorioFormTela({ navigation, route }: PropsTela<"RelatorioForm">) {
  const id = route.params?.id;
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState<number>();
  const [destinatarioId, setDestinatarioId] = useState<number>();
  const [arquivoNome, setArquivoNome] = useState("");
  const [arquivoTipo, setArquivoTipo] = useState("application/pdf");
  const [tamanhoKb, setTamanhoKb] = useState("");
  const [status, setStatus] = useState<StatusRelatorio>("pendente");

  // Opções das relações (vêm das outras tabelas)
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);

  useEffect(() => {
    api.get<Categoria[]>("/categorias").then(setCategorias).catch(() => {});
    api.get<Destinatario[]>("/destinatarios").then(setDestinatarios).catch(() => {});
  }, []);

  const form = useFormulario({
    schema: relatorioSchema,
    carregar: id
      ? async () => {
          const r = await api.get<Relatorio>(`/relatorios/${id}`);
          setTitulo(r.titulo);
          setDescricao(r.descricao ?? "");
          setCategoriaId(r.categoriaId);
          setDestinatarioId(r.destinatarioId);
          setArquivoNome(r.arquivo.nome);
          setArquivoTipo(r.arquivo.tipo);
          setTamanhoKb(String(r.arquivo.tamanhoKb));
          setStatus(r.status);
        }
      : undefined,
    enviar: async (dados) => {
      if (id) await api.put(`/relatorios/${id}`, dados);
      else await api.post("/relatorios", dados);
      navigation.goBack();
    },
  });

  if (form.carregando) return <Carregando />;

  const salvar = () =>
    form.salvar({
      titulo,
      descricao: textoOuUndefined(descricao),
      categoriaId,
      destinatarioId,
      arquivo: {
        nome: arquivoNome,
        tipo: arquivoTipo,
        tamanhoKb: tamanhoKb.trim() === "" ? undefined : Number(tamanhoKb.replace(",", ".")),
      },
      status,
    });

  return (
    <Tela>
      <MensagemErro texto={form.erroGeral} />
      <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} erro={form.erros.titulo} />
      <Campo
        rotulo="Descrição (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        erro={form.erros.descricao}
        multiline
      />

      <Seletor
        rotulo="Categoria"
        opcoes={categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))}
        valor={categoriaId}
        onChange={setCategoriaId}
        erro={form.erros.categoriaId}
        vazio="Cadastre uma categoria primeiro"
      />
      <Seletor
        rotulo="Destinatário"
        opcoes={destinatarios.map((d) => ({ valor: d.id, rotulo: d.nome }))}
        valor={destinatarioId}
        onChange={setDestinatarioId}
        erro={form.erros.destinatarioId}
        vazio="Cadastre um destinatário primeiro"
      />

      <Text style={[estilos.titulo, { marginTop: 8, marginBottom: 8 }]}>Arquivo</Text>
      <Campo
        rotulo="Nome do arquivo"
        value={arquivoNome}
        onChangeText={setArquivoNome}
        erro={form.erros["arquivo.nome"]}
        autoCapitalize="none"
        placeholder="relatorio.pdf"
      />
      <Campo
        rotulo="Tipo"
        value={arquivoTipo}
        onChangeText={setArquivoTipo}
        erro={form.erros["arquivo.tipo"]}
        autoCapitalize="none"
      />
      <Campo
        rotulo="Tamanho (KB)"
        value={tamanhoKb}
        onChangeText={setTamanhoKb}
        erro={form.erros["arquivo.tamanhoKb"]}
        keyboardType="decimal-pad"
      />

      <Seletor<StatusRelatorio>
        rotulo="Status"
        opcoes={[
          { valor: "pendente", rotulo: "Pendente" },
          { valor: "enviado", rotulo: "Enviado" },
        ]}
        valor={status}
        onChange={setStatus}
        erro={form.erros.status}
      />

      <Botao titulo={id ? "Salvar alterações" : "Cadastrar"} carregando={form.salvando} onPress={salvar} />
    </Tela>
  );
}
