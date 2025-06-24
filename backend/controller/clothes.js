const supabaseService = require('../services/supabase');

async function addPiece(request, reply) {
  try {
    const userId = request.user.id;
    
    // 2. Processa a requisição multipart/form-data.
    const data = await request.file();
    if (!data) {
        return reply.code(400).send({ error: 'Nenhum arquivo enviado.' });
    }

    // 3. Os campos do formulário vêm dentro do objeto `data.fields`.
    const itemData = {};
    for (const key in data.fields) {
        itemData[key] = data.fields[key].value;
    }

    // 4. Prepara o objeto do arquivo para passar para o serviço.
    const file = {
      data: await data.toBuffer(),
      filename: data.filename,
      mimetype: data.mimetype
    };

    // 5. Chama o serviço para fazer o trabalho pesado.
    const newPiece = await supabaseService.addClothingItem(userId, itemData, file);

    // 6. Responde com sucesso (201 Created) e os dados da nova peça.
    reply.code(201).send(newPiece);

  } catch (error) {
    console.error('Erro no controlador addPiece:', error);
    reply.code(500).send({ error: 'Erro interno do servidor', message: error.message });
  }
}

module.exports = { addPiece };