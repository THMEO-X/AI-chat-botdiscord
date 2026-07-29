// untils/image-gen.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 
 * @param {string} url
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      // Pollinations đôi khi redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadImage(res.headers.location, filePath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(filePath); });
    }).on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

/**
 * Tạo ảnh từ prompt và gửi lên Discord
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} prompt
 */
async function handleImageGenCommand(interaction, prompt) {
  // Reply ngay "đang tạo ảnh"
  await interaction.reply({ content: `Đang tạo ảnh: **${prompt}**...` });

  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${Math.floor(Math.random() * 9999)}&model=flux`;

    const filePath = path.join(TMP_DIR, `img_${Date.now()}.jpg`);
    await downloadImage(url, filePath);

    const attachment = new AttachmentBuilder(filePath, { name: 'image.jpg' });

    // Edit reply thành ảnh
    await interaction.editReply({
      content: ` **${prompt}**`,
      files: [attachment],
    });

    fs.unlink(filePath, () => {});
  } catch (err) {
    console.error(' Image gen lỗi:', err.message);
    await interaction.editReply({ content: ` Tạo ảnh thất bại: ${err.message}` });
  }
}

module.exports = { handleImageGenCommand };
