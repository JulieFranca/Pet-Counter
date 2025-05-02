const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir arquivos estáticos da pasta public e src/assets
app.use(express.static('public'));
app.use('/src/assets', express.static('src/assets'));

// Cache para contagem de pets
let petsCache = {
  count: 0,
  lastUpdate: 0
};

// Função para atualizar o cache
const updatePetsCache = async () => {
  try {
    const petsData = await fs.readFile('data/pets.json', 'utf8');
    const pets = JSON.parse(petsData);
    petsCache = {
      count: pets.length,
      lastUpdate: Date.now()
    };
    return petsCache.count;
  } catch (error) {
    console.error('Erro ao atualizar cache de pets:', error);
    return null;
  }
};

// Endpoint para obter contagem de pets (com cache)
app.get('/api/pets/count', async (req, res) => {
  try {
    // Se o cache foi atualizado nos últimos 5 segundos, retorna o valor em cache
    if (Date.now() - petsCache.lastUpdate < 5000) {
      return res.json({ count: petsCache.count });
    }

    // Atualiza o cache e retorna o novo valor
    const count = await updatePetsCache();
    if (count === null) {
      throw new Error('Erro ao obter contagem de pets');
    }
    res.json({ count });
  } catch (error) {
    console.error('Erro ao obter contagem:', error);
    res.status(500).json({ error: 'Erro ao obter contagem de pets' });
  }
});

// Middleware para atualizar o cache quando houver mudanças
const updateCacheMiddleware = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // Atualiza o cache após operações bem-sucedidas em pets
    if (res.statusCode >= 200 && res.statusCode < 300) {
      updatePetsCache();
    }
    return originalJson.call(this, data);
  };
  next();
};

// Endpoint para upload de imagem
app.post('/api/upload', async (req, res) => {
  try {
    const { image, fileName, directory } = req.body;

    if (!image || !fileName || !directory) {
      return res.status(400).json({ error: 'Dados incompletos para upload' });
    }

    // Remove o prefixo do base64 (ex: data:image/jpeg;base64,)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Normaliza o caminho do diretório
    const uploadDir = path.resolve(directory);

    // Cria o diretório se não existir
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Erro ao criar diretório:', mkdirError);
      return res.status(500).json({ error: 'Erro ao criar diretório de upload' });
    }

    // Gera um nome único para o arquivo
    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const newFileName = `${path.parse(fileName).name}-${timestamp}${extension}`;
    const filePath = path.join(uploadDir, newFileName);

    // Salva o arquivo
    try {
      await fs.writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('Erro ao salvar arquivo:', writeError);
      return res.status(500).json({ error: 'Erro ao salvar arquivo' });
    }

    // Retorna a URL relativa da imagem
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    console.log('Arquivo salvo com sucesso:', relativePath);
    res.json({ imageUrl: `/${relativePath}` });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar upload: ' + error.message });
  }
});

// Aplica o middleware de cache em todas as rotas de pets
app.use('/api/pets', updateCacheMiddleware);

// Inicializa o cache
updatePetsCache();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 