import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../contexto/AuthContext";
import { useFormulario } from "../componentes/useFormulario";
import { Botao, Campo, MensagemErro, Tela, cores } from "../componentes/ui";
import { loginSchema } from "../schemas";
import { URL_API } from "../servicos/api";
import type { PropsTela } from "../navegacao";

export function LoginTela({ navigation }: PropsTela<"Login">) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const form = useFormulario({
    schema: loginSchema,
    enviar: (d) => entrar(d.email, d.senha),
  });

  return (
    <Tela>
      <View style={{ marginVertical: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: cores.texto }}>Relatórios</Text>
        <Text style={{ color: cores.textoSuave, marginTop: 4 }}>Entre para gerenciar seus relatórios</Text>
      </View>

      <MensagemErro texto={form.erroGeral} />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={form.erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        erro={form.erros.senha}
        secureTextEntry
        onSubmitEditing={() => form.salvar({ email, senha })}
      />
      <Botao titulo="Entrar" carregando={form.salvando} onPress={() => form.salvar({ email, senha })} />

      <Pressable onPress={() => navigation.navigate("Registro")} style={{ padding: 12, alignItems: "center" }}>
        <Text style={{ color: cores.primaria }}>Não tem conta? Cadastre-se</Text>
      </Pressable>

      <Text style={{ color: cores.textoSuave, fontSize: 12, textAlign: "center", marginTop: 24 }}>
        API: {URL_API}
      </Text>
    </Tela>
  );
}
