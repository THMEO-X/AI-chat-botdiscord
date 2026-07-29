// ─── msgemoji.js ──────────────────────────────────────────────────────────────
const EMOJI_LIMIT = 30;

/**
 * Lấy emoji static của guild, inject vào system prompt.
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getGuildEmojiBlock(guild) {
  if (!guild) return '';

  const emojis = guild.emojis.cache
    .filter(e => !e.animated)
    .filter(e => /^[a-zA-Z0-9_]+$/.test(e.name))
    .map(e => ({ name: e.name, tag: `<:${e.name}:${e.id}>` }))
    .slice(0, EMOJI_LIMIT);

  if (emojis.length === 0) return '';

  // Liệt kê rõ từng emoji kèm tag đầy đủ để model copy nguyên xi
  const emojiLines = emojis.map(e => `- ${e.name} → ${e.tag}`).join('\n');

  return (
    `\n\n[EMOJI CỦA SERVER - BẮT BUỘC ĐỌC]:` +
    `\nKhi muốn dùng emoji server, mày PHẢI copy NGUYÊN XI chuỗi ở cột phải (ví dụ <:HuTao_hehe:123456>).` +
    `\nTUYỆT ĐỐI không viết dạng :tên: vì sẽ không hiển thị được.` +
    `\nChọn emoji phù hợp ngữ cảnh, dùng tự nhiên, không lạm dụng.\n` +
    emojiLines
  );
}

/**
 * Lấy cả emoji animated lẫn static.
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getGuildEmojiBlockFull(guild) {
  if (!guild) return '';

  const emojis = guild.emojis.cache
    .filter(e => /^[a-zA-Z0-9_]+$/.test(e.name))
    .map(e => ({
      name: e.name,
      tag: e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`,
    }))
    .slice(0, EMOJI_LIMIT);

  if (emojis.length === 0) return '';

  const emojiLines = emojis.map(e => `- ${e.name} → ${e.tag}`).join('\n');

  return (
    `\n\n[EMOJI CỦA SERVER - BẮT BUỘC ĐỌC]:` +
    `\nKhi muốn dùng emoji server, mày PHẢI copy NGUYÊN XI chuỗi ở cột phải (ví dụ <:HuTao_hehe:123456>).` +
    `\nTUYỆT ĐỐI không viết dạng :tên: vì sẽ không hiển thị được.` +
    `\nChọn emoji phù hợp ngữ cảnh, dùng tự nhiên, không lạm dụng.\n` +
    emojiLines
  );
}

module.exports = { getGuildEmojiBlock, getGuildEmojiBlockFull };
