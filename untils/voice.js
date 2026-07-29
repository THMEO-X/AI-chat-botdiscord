// untils/voice.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const VOICE_THRESHOLD = 15;
const TTS_VOICE = 'vi-VN-HoaiMyNeural';
const TMP_DIR = path.join(__dirname, '../tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * Làm sạch text trước khi đưa vào TTS:
 * - Xóa emoji Discord: <:name:id> và <a:name:id>
 * - Xóa markdown: *, _, ~, `
 * - Xóa mention: <@id> <#id> <@&id>
 * - Trim khoảng trắng thừa
 */
function cleanTextForTTS(text) {
  return text
    .replace(/<a?:[a-zA-Z0-9_]+:\d+>/g, '')  // custom emoji Discord
    .replace(/<[@#&!]{0,2}\d+>/g, '')          // mention, channel, role
    .replace(/\p{Emoji}/gu, '')                // toàn bộ emoji unicode 😀🔥✨...
    .replace(/[*_~`]/g, '')                    // markdown
    .replace(/\s{2,}/g, ' ')                   // khoảng trắng thừa
    .trim();
}

function generateTTS(text, fileName) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(TMP_DIR, `${fileName}.mp3`);
    const cleanText = cleanTextForTTS(text);

    if (!cleanText) return reject(new Error('Text rỗng sau khi làm sạch'));

    const safeText = cleanText.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `edge-tts --voice "${TTS_VOICE}" --text "${safeText}" --write-media "${outPath}"`;

    exec(cmd, { timeout: 30000 }, (err) => {
      if (err) return reject(err);
      if (!fs.existsSync(outPath)) return reject(new Error('TTS output file not found'));
      resolve(outPath);
    });
  });
}

/**
 * Gửi text + file voice cùng 1 tin nhắn nếu guild bật voice và reply đủ dài.
 * Trả về true nếu đã gửi voice (caller không cần gửi text nữa), false nếu không gửi.
 */
async function sendVoiceReply(target, reply, guildId, userName, isInteraction = false, voiceGuilds = new Set(), extraContent = '') {
  if (!voiceGuilds.has(guildId) || reply.length <= VOICE_THRESHOLD) return false;

  try {
    const fileName = `tts_${Date.now()}`;
    const filePath = await generateTTS(reply, fileName);
    const attachment = new AttachmentBuilder(filePath, { name: 'voice.mp3' });

    // Gửi text + voice cùng 1 tin nhắn
    const payload = {
      content: reply + (extraContent ? `\n${extraContent}` : ''),
      files: [attachment],
    };

    if (isInteraction) {
      await target.editReply(payload);
    } else {
      await target.reply(payload);
    }

    fs.unlink(filePath, () => {});
    return true;
  } catch (err) {
    console.error('❌ TTS lỗi:', err.message);
    return false;
  }
}

module.exports = { sendVoiceReply, VOICE_THRESHOLD };
