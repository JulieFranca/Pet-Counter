# Pet Count

Aplicativo para cadastro e gerenciamento de pets, com funcionalidades para usuários comuns e administradores.

## Funcionalidades

- Cadastro e login de usuários
- Cadastro e gerenciamento de pets
- Painel administrativo
- Contador público de pets em tempo real
- Interface responsiva para dispositivos móveis

## Requisitos

- Node.js 16 ou superior
- npm ou yarn

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

3. Inicie o servidor e a aplicação:
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

## Rotas

- `/` - Lista de pets (requer autenticação)
- `/login` - Página de login
- `/register` - Página de registro
- `/pets` - Lista de pets
- `/pets/:id` - Detalhes do pet
- `/pets/new` - Cadastro de novo pet
- `/pets/:id/edit` - Edição de pet
- `/admin` - Painel administrativo
- `/counter` - Contador público de pets

## Credenciais de Administrador

- Email: julie@admin.com
- Senha: Akagami@666

## Tecnologias Utilizadas

- React
- TypeScript
- Material-UI
- Redux Toolkit
- React Router
- Axios
- JSON Server
