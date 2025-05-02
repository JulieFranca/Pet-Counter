# Pet Count

Aplicativo para cadastro e gerenciamento de pets, com funcionalidades para usuários comuns e administradores.

## Funcionalidades

- Cadastro e login de usuários com sistema de aprovação
- Cadastro e gerenciamento de pets com upload de fotos
- Sistema de notificações em tempo real
- Painel administrativo com gerenciamento de usuários
- Contador público de pets em tempo real
- Interface responsiva para dispositivos móveis
- Sistema de roles (admin/user)
- Perfil de usuário com nome e sobrenome
- Upload de imagens com compressão e redimensionamento automático
- Sistema de notificações para novos pets cadastrados

## Requisitos

- Node.js 16 ou superior
- npm ou yarn
- Firebase (para autenticação e banco de dados)

## Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd pet-count
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente do Firebase:
- Crie um arquivo `.env` na raiz do projeto
- Adicione as configurações do Firebase:
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

4. Inicie o servidor e a aplicação:
```bash
npm start
```

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
