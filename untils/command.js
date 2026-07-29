// untils/command.js
const { buttons: buttonConfig } = require('./button.js');
const { getUser, appendHistory, saveChannel, removeChannel } = require('./uid.js');
const { buildSystemPrompt } = require('./modereply.js');

function checkAdmin(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const isOwner = guild.ownerId === interaction.user.id;
  const topRole = guild.roles.cache
    .filter(r => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .first();
  return isOwner || (topRole && member.roles.cache.has(topRole.id));
}

module.exports = function registerInteractionHandler(
  client, activeChannels, feelingGuilds, saveFeelingGuild, voiceGuilds, saveVoiceGuild,
  sessionModule, sessionLabels, prompts, groqRequest, sendReply, sendVoiceReply, handleImageGenCommand
) {
  client.on('interactionCreate', async (interaction) => {

    // ── /setchannel ───────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'setchannel') {
      if (!checkAdmin(interaction))
        return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });

      const targetId = interaction.options.getString('id') ?? interaction.channelId;
      if (activeChannels.has(targetId)) {
        activeChannels.delete(targetId);
        removeChannel(targetId);
        return interaction.reply({ content: `🔕 Bot đã tắt ở channel <#${targetId}>`, ephemeral: true });
      } else {
        activeChannels.add(targetId);
        saveChannel(targetId);
        return interaction.reply({ content: `✅ Bot sẽ trả lời tin nhắn trong channel <#${targetId}>`, ephemeral: true });
      }
    }

    // ── /stopsetchannel ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'stopsetchannel') {
      if (!checkAdmin(interaction))
        return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });

      const targetId = interaction.options.getString('id') ?? interaction.channelId;
      if (!activeChannels.has(targetId))
        return interaction.reply({ content: `⚠️ Bot chưa được bật ở channel <#${targetId}>`, ephemeral: true });

      activeChannels.delete(targetId);
      removeChannel(targetId);
      return interaction.reply({ content: `🔕 Đã tắt auto reply ở channel <#${targetId}>`, ephemeral: true });
    }

    // ── /feeling ──────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'feeling') {
      const guildId = interaction.guild?.id;
      if (!guildId) return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
      if (!checkAdmin(interaction)) return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });
      feelingGuilds.add(guildId);
      saveFeelingGuild(guildId, true);
      return interaction.reply({ content: '💬 Đã bật chế độ cảm xúc!', ephemeral: true });
    }

    // ── /nofeeling ────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'nofeeling') {
      const guildId = interaction.guild?.id;
      if (!guildId) return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
      if (!checkAdmin(interaction)) return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });
      feelingGuilds.delete(guildId);
      saveFeelingGuild(guildId, false);
      return interaction.reply({ content: '😶 Đã tắt chế độ cảm xúc.', ephemeral: true });
    }

    // ── /voice ────────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'voice') {
      const guildId = interaction.guild?.id;
      if (!guildId) return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
      if (!checkAdmin(interaction)) return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });
      voiceGuilds.add(guildId);
      saveVoiceGuild(guildId, true);
      return interaction.reply({ content: '🔊 Đã bật chế độ voice! Bot sẽ gửi audio khi tin nhắn dài hơn 150 ký tự.', ephemeral: true });
    }

    // ── /novoice ──────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'novoice') {
      const guildId = interaction.guild?.id;
      if (!guildId) return interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
      if (!checkAdmin(interaction)) return interaction.reply({ content: '❌ Mày không có quyền dùng lệnh này.', ephemeral: true });
      voiceGuilds.delete(guildId);
      saveVoiceGuild(guildId, false);
      return interaction.reply({ content: '🔇 Đã tắt chế độ voice.', ephemeral: true });
    }

    // ── /image ────────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'image') {
      const prompt = interaction.options.getString('prompt');
      return handleImageGenCommand(interaction, prompt);
    }

    if (!interaction.isButton()) return;

    // ── Button handler ────────────────────────────────────────────────────────
    const userName = interaction.member?.displayName || interaction.user.username;
    const customId = interaction.customId;

    if (customId === 'code_no') return interaction.reply({ content: 'Không', ephemeral: true });
    if (customId === 'chat_ok') return interaction.reply({ content: 'OK', ephemeral: true });

    await interaction.deferReply();

    const session = sessionLabels[userName];
    const selectedModule = sessionModule[userName] ?? Object.keys(prompts)[0];
    const allBtns = buttonConfig[selectedModule];
    const btnIndex = allBtns?.findIndex(b => b.customId === customId);
    const followUp = session?.labels?.[btnIndex]?.followUp ?? 'Tiếp tục đi.';

    const userProfile = getUser(userName);
    const systemPrompt = buildSystemPrompt(
      userName, userProfile.summary, prompts[selectedModule], interaction.guild
    );
    const recentHistory = userProfile.history.slice(-20).map(h => ({ role: h.role, content: h.content }));

    const { status, body } = await groqRequest([
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: followUp },
    ]);

    if (status !== 200) return interaction.editReply('❌ Groq lỗi.');
    const reply = body.choices?.[0]?.message?.content?.trim();
    if (!reply) return interaction.editReply('❌ Không có phản hồi.');

    appendHistory(userName, 'user', followUp);
    appendHistory(userName, 'assistant', reply);

    if (selectedModule !== 'code') {
      const voiceSent = await sendVoiceReply(interaction, reply, interaction.guild?.id, userName, true, voiceGuilds);
      if (!voiceSent) await sendReply(interaction, reply, selectedModule, userName, true, interaction.guild?.id);
    } else {
      await sendReply(interaction, reply, selectedModule, userName, true, interaction.guild?.id);
    }
  });
};
