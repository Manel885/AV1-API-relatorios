import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Todas as telas e os parâmetros que cada uma recebe.
// Nos formulários, "id" presente = edição; ausente = cadastro.
export type Rotas = {
  Login: undefined;
  Registro: undefined;
  Inicio: undefined;
  Relatorios: undefined;
  RelatorioForm: { id?: number };
  Categorias: undefined;
  CategoriaForm: { id?: number };
  Destinatarios: undefined;
  DestinatarioForm: { id?: number };
  Usuarios: undefined;
  UsuarioForm: { id?: number };
};

export type PropsTela<T extends keyof Rotas> = NativeStackScreenProps<Rotas, T>;
