// services/supabaseService.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Lida com o upload de uma imagem e a inserção dos dados da peça no banco.
 * @param {string} userId - O ID do usuário dono da peça.
 * @param {object} itemData - Dados da peça (name, brand, etc.).
 * @param {object} file - O arquivo de imagem vindo do upload.
 * @returns {object} O novo item de roupa criado.
 */
async function addClothingItem(userId, itemData, file) {
  // 1. Define um caminho único para o arquivo no Storage.
  const filePath = `${userId}/${Date.now()}-${file.filename}`;

  // 2. Faz o upload do buffer do arquivo para o Supabase Storage.
  const { error: uploadError } = await supabase.storage
    .from('clothing_images')
    .upload(filePath, file.data, {
      contentType: file.mimetype,
      upsert: false // Não sobrescrever se o arquivo já existir
    });

  if (uploadError) {
    throw new Error(`Erro no upload da imagem: ${uploadError.message}`);
  }

  // 3. Obtém a URL pública da imagem que acabamos de enviar.
  const { data: { publicUrl } } = supabase.storage
    .from('clothing_images')
    .getPublicUrl(filePath);

  // 4. Prepara os dados para inserir na tabela 'clothes'.
  const pieceToInsert = {
    ...itemData,
    user_id: userId,
    image_url: publicUrl,
  };

  // 5. Insere os dados no banco de dados e retorna o novo registro.
  const { data: newPiece, error: insertError } = await supabase
    .from('clothes')
    .insert(pieceToInsert)
    .select()
    .single(); // Esperamos que apenas um item seja criado.

  if (insertError) {
    throw new Error(`Erro ao salvar no banco: ${insertError.message}`);
  }

  return newPiece;
}

// Futuramente, adicionaremos outras funções aqui (getClothes, getOutfits, etc.)

module.exports = { addClothingItem };