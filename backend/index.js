// app.js

require('dotenv').config();
const path = require('path');
const Fastify = require('fastify');

// Cria a instância do Fastify
const fastify = Fastify({ logger: true });

// --- REGISTRO DE PLUGINS PRIMEIROS ---

// Registra o plugin de autenticação. O Fastify garante que ele será
// carregado antes das rotas que vêm depois.
fastify.register(require('./plugins/auth'));

// --- REGISTRO DAS ROTAS DEPOIS ---

// Vamos usar autoload para carregar TODAS as rotas da pasta 'routes'
// Isso mantém o app.js limpo.
fastify.register(require('@fastify/autoload'), {
  dir: path.join(__dirname, 'routes'), // Diz para carregar arquivos da pasta 'routes'
  options: { prefix: '/api' } // Opcional: todas as rotas começarão com /api
});

// A rota de teste agora vai para um arquivo separado, mas por enquanto,
// podemos deixar uma rota raiz aqui para testes.
fastify.get('/', async (request, reply) => {
    return { status: 'ok', message: 'API está no ar!' };
});


// Função para iniciar o servidor
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();