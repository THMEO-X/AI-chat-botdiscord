const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'uid.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}', 'utf-8');
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ─── User history & summary ───────────────────────────────────────────────────
function getUser(userName) {
  const db = loadDB();
  return db[userName] ?? { summary: '', history: [] };
}

function appendHistory(userName, role, content) {
  const db = loadDB();
  if (!db[userName]) db[userName] = { summary: '', history: [] };
  db[userName].history.push({ role, content, ts: Date.now() });
  saveDB(db);
}

function saveSummary(userName, summary) {
  const db = loadDB();
  if (!db[userName]) db[userName] = { summary: '', history: [] };
  db[userName].summary = summary;
  db[userName].history = db[userName].history.slice(-100);
  saveDB(db);
}

// ─── Channels ─────────────────────────────────────────────────────────────────
function loadChannels() {
  const db = loadDB();
  return new Set(db.__channels ?? []);
}

function saveChannel(channelId) {
  const db = loadDB();
  const channels = new Set(db.__channels ?? []);
  channels.add(channelId);
  db.__channels = [...channels];
  saveDB(db);
}

function removeChannel(channelId) {
  const db = loadDB();
  const channels = new Set(db.__channels ?? []);
  channels.delete(channelId);
  db.__channels = [...channels];
  saveDB(db);
}

// ─── Feeling guilds ───────────────────────────────────────────────────────────
function loadFeelingGuilds() {
  const db = loadDB();
  return new Set(db.__feelingGuilds ?? []);
}

function saveFeelingGuild(guildId, enabled) {
  const db = loadDB();
  const guilds = new Set(db.__feelingGuilds ?? []);
  enabled ? guilds.add(guildId) : guilds.delete(guildId);
  db.__feelingGuilds = [...guilds];
  saveDB(db);
}

// ─── Voice guilds ─────────────────────────────────────────────────────────────
function loadVoiceGuilds() {
  const db = loadDB();
  return new Set(db.__voiceGuilds ?? []);
}

function saveVoiceGuild(guildId, enabled) {
  const db = loadDB();
  const guilds = new Set(db.__voiceGuilds ?? []);
  enabled ? guilds.add(guildId) : guilds.delete(guildId);
  db.__voiceGuilds = [...guilds];
  saveDB(db);
}

module.exports = {
  getUser, appendHistory, saveSummary,
  loadChannels, saveChannel, removeChannel,
  loadFeelingGuilds, saveFeelingGuild,
  loadVoiceGuilds, saveVoiceGuild,
};
