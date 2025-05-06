# Pet Counter

Aplicação para cadastro, gerenciamento e contagem de pets, com autenticação de usuários, painel administrativo e funcionalidades avançadas de perfil.

## Funcionalidades

- **Cadastro de Usuário:**  
  - Campos obrigatórios: nome, sobrenome, e-mail, senha (com validação forte).
  - Fluxo de perfil incompleto: usuários antigos ou incompletos são direcionados para preencher nome e sobrenome.
  - Mensagens de erro amigáveis para e-mail já em uso, e-mail inválido e senha fraca.

- **Gestão de Pets:**  
  - Cadastro, edição e remoção de pets.
  - Upload de imagem do pet com compressão automática e validação de tamanho (máx. 1MB).
  - Campos de data de nascimento e adoção, com preenchimento automático ao editar.
  - Cálculo dinâmico da idade do pet em anos e meses, exibido no formulário e atualizado ao alterar datas.
  - Exibição do nome completo do dono do pet em todas as listagens.

- **Painel Administrativo:**  
  - Aprovação e rejeição de novos usuários.
  - Listagem de usuários ativos com nome completo, e-mail e role.
  - Listagem de todos os pets com nome do dono (nome completo).
  - Ações de editar e remover pets diretamente na área do usuário.

- **Notificações:**  
  - Notificações para novos pets cadastrados.

- **Configuração de Admin via `.env`:**  
  - Permite definir múltiplos administradores com nome, sobrenome, e-mail e senha.

## Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/pet-counter.git
   cd pet-counter
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o arquivo `.env`:**
   Exemplo:
   ```
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   # Admin Configuration
   # ADMIN_EMAIL_2=seu-email-admin-2@exemplo.com
   # ADMIN_PASSWORD_2=sua-senha-admin-2
   # ADMIN_FIRSTNAME_2=NomeDoAdmin2
   # ADMIN_LASTNAME_2=SobreNomeDoAdmin2
   ```

4. **Rode a aplicação:**
   ```bash
   npm run dev
   ```

## Principais Melhorias Recentes

- **Datas de nascimento e adoção agora são salvas corretamente no banco de dados.**
- **Campos de data são preenchidos automaticamente ao editar um pet.**
- **Idade do pet exibida dinamicamente em anos e meses, considerando nascimento ou adoção.**
- **Upload de imagem restaurado para fluxo simples e funcional.**
- **Exibição do nome completo do usuário e do dono do pet em todas as telas.**
- **Ações de editar e remover pets disponíveis diretamente na área do usuário.**
- **Validações e mensagens de erro aprimoradas.**
- **Configuração de múltiplos administradores via `.env`.**

## Observações

- Certifique-se de que o Firebase está corretamente configurado.
- Para evitar problemas de dependências, sempre rode `npm install` após atualizar o projeto ou o arquivo `.env`.
- Caso enfrente problemas com datas, verifique se o Firestore está aceitando objetos do tipo `Date` ou `Timestamp`.

---

Se precisar de mais detalhes ou quiser personalizar o README, me avise!

## Requisitos

- Node.js 16 ou superior
- npm ou yarn
- Firebase (para autenticação e banco de dados)

## Estrutura do Projeto

- `/src/components` - Componentes reutilizáveis
- `/src/pages` - Páginas da aplicação
- `/src/services` - Serviços de API
- `/src/store` - Gerenciamento de estado com Redux
- `/src/types` - Definições de tipos TypeScript
- `/src/utils` - Funções utilitárias
- `/src/contexts` - Contextos React
- `/src/lib` - Funções de negócio

## Rotas

- `/` - Lista de pets (requer autenticação)
- `/login` - Página de login
- `/register` - Página de registro
- `/pending` - Página de aprovação pendente
- `/pets` - Lista de pets
- `/pets/:id` - Detalhes do pet
- `/pets/new` - Cadastro de novo pet
- `/pets/:id/edit` - Edição de pet
- `/admin` - Painel administrativo
- `/counter` - Contador público de pets
- `/dashboard` - Dashboard administrativo


## Tecnologias Utilizadas

- React
- TypeScript
- Material-UI
- Redux Toolkit
- React Router
- Firebase (Authentication, Firestore, Storage)
- Image Compression
- Axios
- JSON Server

## Limites e Restrições

- Tamanho máximo de imagem: 5MB
- Tipos de imagem permitidos: JPG, PNG, GIF
- Dimensões máximas da imagem: 800x800px
- Nome do pet: máximo 50 caracteres
- Biografia do pet: máximo 500 caracteres
- Idade do pet: máximo 30 anos
