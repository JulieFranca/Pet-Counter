const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Criar servidor Express
const app = express();
const port = 3000;

// Habilitar CORS para todas as origens com configurações específicas
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5177'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configurar o body parser para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Adicionar middleware para debug de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servidor Json estático
const jsonServerApp = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public')
});

// Carregar as rotas do arquivo routes.json
const routes = JSON.parse(fs.readFileSync('routes.json', 'utf8'));
const rewriter = jsonServer.rewriter(routes);

// Configurar middlewares do json-server
jsonServerApp.use(middlewares);
jsonServerApp.use(rewriter);
jsonServerApp.use(router);

// Montar o json-server no servidor Express em /api
app.use('/api', jsonServerApp);

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota para verificar se o servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando normalmente' });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Arquivos estáticos: http://localhost:${port}`);
}); 