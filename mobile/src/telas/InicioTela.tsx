import { Pressable, Text, View } from "react-native";
import { useAuth } from "../contexto/AuthContext";
import { Botao, Tela, cores, estilos } from "../componentes/ui";
import type { PropsTela, Rotas } from "../navegacao";

const MENU: { rota: keyof Rotas; titulo: string; descricao: string }[] = [
  { rota: "Relatorios", titulo: "Relatórios", descricao: "Cadastre e acompanhe os relatórios" },
  { rota: "Categorias", titulo: "Categorias", descricao: "Organize os relatórios por tipo" },
  { rota: "Destinatarios", titulo: "Destinatários", descricao: "Quem recebe os relatórios" },
  { rota: "Usuarios", titulo: "Usuários", descricao: "Contas com acesso ao sistema" },
];

export function InicioTela({ navigation }: PropsTela<"Inicio">) {
  const { usuario, sair } = useAuth();

  return (
    <Tela>
      <Text style={{ fontSize: 22, fontWeight: "700", color: cores.texto }}>Olá, {usuario?.nome}!</Text>
      <Text style={{ color: cores.textoSuave, marginBottom: 16 }}>{usuario?.email}</Text>

      {MENU.map((item) => (
        <Pressable
          key={item.rota}
          onPress={() => navigation.navigate(item.rota as "Relatorios")}
          style={({ pressed }) => [estilos.cartao, pressed && { backgroundColor: cores.primariaClara }]}
        >
          <Text style={estilos.titulo}>{item.titulo}</Text>
          <Text style={estilos.textoSuave}>{item.descricao}</Text>
        </Pressable>
      ))}

      <View style={{ marginTop: 16 }}>
        <Botao titulo="Sair" variante="secundario" onPress={() => void sair()} />
      </View>
    </Tela>
  );
}
