const clothingController = require('../controller/clothes');

async function clothingRoutes(fastify, options) {

  fastify.post('/clothes', {

    preHandler: [fastify.authenticate] 
  }, clothingController.addPiece);

}

module.exports = clothingRoutes;