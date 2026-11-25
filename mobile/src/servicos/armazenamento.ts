import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// No celular o token fica no SecureStore (criptografado).
// No navegador (expo web) o SecureStore não existe, então usamos o localStorage.
const CHAVE = "token_jwt";

export async function salvarToken(token: string) {
  if (Platform.OS === "web") localStorage.setItem(CHAVE, token);
  else await SecureStore.setItemAsync(CHAVE, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(CHAVE);
  return SecureStore.getItemAsync(CHAVE);
}

export async function apagarToken() {
  if (Platform.OS === "web") localStorage.removeItem(CHAVE);
  else await SecureStore.deleteItemAsync(CHAVE);
}
