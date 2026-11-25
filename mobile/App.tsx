import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/contexto/AuthContext";
import { Carregando, cores } from "./src/componentes/ui";
import type { Rotas } from "./src/navegacao";
import { LoginTela } from "./src/telas/LoginTela";
import { RegistroTela } from "./src/telas/RegistroTela";
import { InicioTela } from "./src/telas/InicioTela";
import { RelatorioFormTela, RelatoriosTela } from "./src/telas/Relatorios";
import { CategoriaFormTela, CategoriasTela } from "./src/telas/Categorias";
import { DestinatarioFormTela, DestinatariosTela } from "./src/telas/Destinatarios";
import { UsuarioFormTela, UsuariosTela } from "./src/telas/Usuarios";

const Stack = createNativeStackNavigator<Rotas>();

function Navegacao() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;

  // Sem usuário logado só existem as telas de login/registro.
  // Com usuário logado, só as telas protegidas.
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: cores.branco,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      {usuario ? (
        <>
          <Stack.Screen name="Inicio" component={InicioTela} options={{ title: "Início" }} />
          <Stack.Screen name="Relatorios" component={RelatoriosTela} options={{ title: "Relatórios" }} />
          <Stack.Screen
            name="RelatorioForm"
            component={RelatorioFormTela}
            options={({ route }) => ({ title: route.params?.id ? "Editar relatório" : "Novo relatório" })}
          />
          <Stack.Screen name="Categorias" component={CategoriasTela} />
          <Stack.Screen
            name="CategoriaForm"
            component={CategoriaFormTela}
            options={({ route }) => ({ title: route.params?.id ? "Editar categoria" : "Nova categoria" })}
          />
          <Stack.Screen name="Destinatarios" component={DestinatariosTela} options={{ title: "Destinatários" }} />
          <Stack.Screen
            name="DestinatarioForm"
            component={DestinatarioFormTela}
            options={({ route }) => ({ title: route.params?.id ? "Editar destinatário" : "Novo destinatário" })}
          />
          <Stack.Screen name="Usuarios" component={UsuariosTela} options={{ title: "Usuários" }} />
          <Stack.Screen
            name="UsuarioForm"
            component={UsuarioFormTela}
            options={({ route }) => ({ title: route.params?.id ? "Editar usuário" : "Novo usuário" })}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginTela} options={{ headerShown: false }} />
          <Stack.Screen name="Registro" component={RegistroTela} options={{ title: "Criar conta" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navegacao />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
