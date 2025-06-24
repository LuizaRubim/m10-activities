async function profileRoutes(fastify, options) {

  // A rota agora é relativa ao arquivo. Como o prefixo é /api,
  // esta rota será acessível em GET /api/profile
  fastify.get('/profile', { 
    preHandler: [fastify.authenticate] // AGORA fastify.authenticate VAI EXISTIR!
  }, async (request, reply) => {
    // Graças ao preHandler, este código só roda se o token for válido.
    return {
      message: 'Esta é uma rota protegida.',
      user: request.user,
    };
  });

  // Você pode adicionar outras rotas relacionadas ao perfil aqui,
  // como PUT /profile para atualizar, etc.

}

module.exports = profileRoutes;