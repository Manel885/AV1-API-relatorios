import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

export const cores = {
  primaria: "#2563eb",
  primariaClara: "#dbeafe",
  perigo: "#dc2626",
  perigoClaro: "#fee2e2",
  sucesso: "#16a34a",
  sucessoClaro: "#dcfce7",
  alerta: "#b45309",
  alertaClaro: "#fef3c7",
  texto: "#111827",
  textoSuave: "#6b7280",
  borda: "#d1d5db",
  fundo: "#f3f4f6",
  branco: "#ffffff",
};

// Tela com rolagem e espaçamento padrão (usada pelos formulários)
export function Tela({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

type CampoProps = TextInputProps & { rotulo: string; erro?: string };

export function Campo({ rotulo, erro, style, ...props }: CampoProps) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoSuave}
        style={[estilos.input, erro ? estilos.inputErro : null, style]}
        {...props}
      />
      {erro ? <Text style={estilos.textoErro}>{erro}</Text> : null}
    </View>
  );
}

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: "primario" | "secundario" | "perigo";
  carregando?: boolean;
  pequeno?: boolean;
};

export function Botao({ titulo, onPress, variante = "primario", carregando, pequeno }: BotaoProps) {
  const cor = variante === "perigo" ? cores.perigo : cores.primaria;
  const cheio = variante === "primario";
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [
        estilos.botao,
        pequeno && estilos.botaoPequeno,
        { backgroundColor: cheio ? cor : cores.branco, borderColor: cor, opacity: pressed || carregando ? 0.7 : 1 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cheio ? cores.branco : cor} />
      ) : (
        <Text style={[estilos.textoBotao, pequeno && { fontSize: 13 }, { color: cheio ? cores.branco : cor }]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

type Opcao<T> = { valor: T; rotulo: string };

// Lista de "chips" para escolher uma opção (ex.: categoria do relatório)
export function Seletor<T extends string | number>(props: {
  rotulo: string;
  opcoes: Opcao<T>[];
  valor: T | undefined;
  onChange: (valor: T) => void;
  erro?: string;
  vazio?: string;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>{props.rotulo}</Text>
      <View style={estilos.chips}>
        {props.opcoes.length === 0 && <Text style={estilos.textoSuave}>{props.vazio ?? "Nenhuma opção"}</Text>}
        {props.opcoes.map((opcao) => {
          const ativo = opcao.valor === props.valor;
          return (
            <Pressable
              key={String(opcao.valor)}
              onPress={() => props.onChange(opcao.valor)}
              style={[estilos.chip, ativo && estilos.chipAtivo]}
            >
              <Text style={[estilos.chipTexto, ativo && { color: cores.branco }]}>{opcao.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
      {props.erro ? <Text style={estilos.textoErro}>{props.erro}</Text> : null}
    </View>
  );
}

export function MensagemErro({ texto }: { texto?: string | null }) {
  if (!texto) return null;
  return (
    <View style={estilos.caixaErro}>
      <Text style={{ color: cores.perigo }}>{texto}</Text>
    </View>
  );
}

export function Carregando() {
  return (
    <View style={estilos.centro}>
      <ActivityIndicator size="large" color={cores.primaria} />
    </View>
  );
}

export function Etiqueta({ texto, tipo }: { texto: string; tipo: "sucesso" | "alerta" | "neutro" }) {
  const mapa = {
    sucesso: [cores.sucessoClaro, cores.sucesso],
    alerta: [cores.alertaClaro, cores.alerta],
    neutro: [cores.primariaClara, cores.primaria],
  } as const;
  const [fundo, cor] = mapa[tipo];
  return (
    <View style={[estilos.etiqueta, { backgroundColor: fundo }]}>
      <Text style={{ color: cor, fontSize: 12, fontWeight: "600" }}>{texto}</Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 4 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  campo: { marginBottom: 12 },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.texto, marginBottom: 6 },
  input: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: cores.texto,
  },
  inputErro: { borderColor: cores.perigo },
  textoErro: { color: cores.perigo, fontSize: 13, marginTop: 4 },
  textoSuave: { color: cores.textoSuave },
  botao: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginVertical: 4,
  },
  botaoPequeno: { paddingVertical: 6, paddingHorizontal: 10, marginVertical: 0 },
  textoBotao: { fontSize: 16, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: cores.branco,
  },
  chipAtivo: { backgroundColor: cores.primaria },
  chipTexto: { color: cores.primaria, fontWeight: "500" },
  caixaErro: { backgroundColor: cores.perigoClaro, borderRadius: 8, padding: 12, marginBottom: 12 },
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  titulo: { fontSize: 16, fontWeight: "600", color: cores.texto },
  etiqueta: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
