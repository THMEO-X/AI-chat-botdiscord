// untils/modereply.js
const modeReplyConfig = require('../module/modereply.json');
const { getGuildEmojiBlock } = require('./Msgemoij.js');

/**
 * @param {string} userName
 * @param {string|null} summary
 * @param {string} modulePrompt
 * @param {import('discord.js').Guild|null} guild
 */
function buildSystemPrompt(userName, summary, modulePrompt, guild = null) {
  const memoryBlock = summary
    ? `\n\n[Ký ức về ${userName}]:\n${summary}`
    : '';

  const resolvedModule = modulePrompt.replace('${name.user}', userName);
  const emojiBlock = getGuildEmojiBlock(guild);

  return (
    modeReplyConfig.identity.replace('${userName}', userName) +
    memoryBlock +
    `\n\n${resolvedModule}` +
    `\n\n${modeReplyConfig.replyRules}` +
    emojiBlock
  );
}

module.exports = { buildSystemPrompt };
