const { EmbedBuilder } = require('discord.js');
const { colors } = require('./config.json');

function buildEmbed(reply, colorKey, userName) {
  const color = parseInt(colors[colorKey] ?? colors.default);
  return new EmbedBuilder()
    .setColor(color)
    .setDescription(reply.length > 4096 ? reply.slice(0, 4093) + '...' : reply)
    .setFooter({ text: `THMEO-X • ${userName}` })
    .setTimestamp();
}

module.exports = { buildEmbed };