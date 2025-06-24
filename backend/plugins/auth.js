
const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

async function authPlugin(fastify, options) {
  
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new Error('Nenhum token de autorização fornecido.');
      }

      // 2. O formato do cabeçalho é "Bearer SEU_TOKEN_JWT".
      //    Removemos o "Bearer " para pegar apenas o token.
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new Error('Token malformado.');
      }
      
      // 3. Verifica se o token é válido usando o segredo JWT do Supabase.
      //    Se o token for inválido ou expirado, a função `jwt.verify` vai disparar um erro.
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      
      // 4. Se o token for válido, `decoded` conterá as informações do usuário.
      //    O ID do usuário está na propriedade 'sub' (subject).
      //    Anexamos as informações do usuário à requisição para que
      //    nossos controladores possam usá-las mais tarde.
      request.user = { 
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

    } catch (err) {
      // Se qualquer parte do 'try' falhar, respondemos com um erro 401 (Não Autorizado).
      reply.code(401).send({ error: 'Autenticação falhou', message: err.message });
    }
  });
}

// Exporta o plugin
module.exports = fp(authPlugin);