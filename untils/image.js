const https = require('https');
const config = require('../config.json');

const VISION_MODELS = 'meta-llama/llama-4-scout-17b-16e-instruct';

function isImageUrl(text) {
  return /https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp)(\?[^\s]*)?$/i.test(text.trim());
}

function groqVisionRequest(imageUrl) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: VISION_MODELS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: 'Đọc toàn bộ văn bản trong ảnh này. Chỉ trả về đúng nội dung chữ trong ảnh, không giải thích, không thêm bất kỳ thứ gì. Loại bỏ hoàn toàn emoji nếu có.',
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function buildImageEmbed(text, userName) {
  return {
    color: 0x00BFFF, // neon blue
    author: { name: userName },
    description: text,
    footer: { text: 'OCR · THMEO-X' },
    timestamp: new Date().toISOString(),
  };
}

async function handleImageMessage(message) {
  const url = message.content.trim();
  if (!isImageUrl(url)) return false;

  await message.channel.sendTyping();

  const { status, body } = await groqVisionRequest(url);
  if (status !== 200) {
    await message.reply('❌ Không thể đọc ảnh.');
    return true;
  }

  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    await message.reply('❌ Không tìm thấy chữ trong ảnh.');
    return true;
  }

  const userName = message.member?.displayName || message.author.username;
  const embed = buildImageEmbed(text, userName);
  await message.reply({ embeds: [embed] });
  return true;
}

module.exports = { handleImageMessage };