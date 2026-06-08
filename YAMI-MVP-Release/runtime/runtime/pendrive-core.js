const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const YAMI_HOME = process.env.YAMI_HOME || path.join(process.env.USERPROFILE || ".", ".yami");
const PENDRIVE_DIR = process.env.YAMI_PENDRIVE_DIR || path.join(YAMI_HOME, "pendrive");
const YAMI_CONFIG_PATH = process.env.YAMI_CONFIG_PATH || path.join(YAMI_HOME, "yami.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJSON(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function generateYamiId() {
  const random = crypto.randomBytes(24).toString("hex");
  const timestamp = Date.now().toString(36);
  const prefix = "ymi";
  return `${prefix}-${timestamp}-${random.slice(0, 16)}`;
}

function getPendrivePaths() {
  return {
    root: PENDRIVE_DIR,
    identity: path.join(PENDRIVE_DIR, "yami-id.json"),
    profile: path.join(PENDRIVE_DIR, "profile.json"),
    appearance: path.join(PENDRIVE_DIR, "appearance.json"),
    evolution: path.join(PENDRIVE_DIR, "evolution.json"),
    modules: path.join(PENDRIVE_DIR, "modules.json"),
    voice: path.join(PENDRIVE_DIR, "voice.json"),
    sync: path.join(PENDRIVE_DIR, "sync.json"),
    memory: path.join(PENDRIVE_DIR, "memory", "entries.json"),
    socialFriends: path.join(PENDRIVE_DIR, "social", "friends.json"),
    socialProfileCard: path.join(PENDRIVE_DIR, "social", "profile-card.json"),
    socialMessages: path.join(PENDRIVE_DIR, "social", "messages.json"),
    socialGroups: path.join(PENDRIVE_DIR, "social", "groups.json")
  };
}

function ensurePendriveStructure() {
  const dirs = [
    PENDRIVE_DIR,
    path.join(PENDRIVE_DIR, "social"),
    path.join(PENDRIVE_DIR, "memory")
  ];
  for (const dir of dirs) ensureDir(dir);
}

function getOrCreateIdentity() {
  ensurePendriveStructure();
  const paths = getPendrivePaths();
  let identity = readJSON(paths.identity, null);

  if (!identity || !identity.yamiId) {
    const now = new Date().toISOString();
    identity = {
      yamiId: generateYamiId(),
      instanceName: "Yami",
      createdAt: now,
      updatedAt: now,
      hardwareId: "",
      generation: 1,
      version: "1.0.0-pendrive",
      publicKey: "",
      metadata: {
        origin: "pendrive-nucleus",
        protocol: "yami-identity-1.0",
        compatibility: ["yami-pendrive-1.0"]
      }
    };
    writeJSON(paths.identity, identity);
    console.log(`[pendrive] Nova identidade gerada: ${identity.yamiId}`);
  }

  return identity;
}

function getIdentity() {
  return readJSON(getPendrivePaths().identity, null);
}

function getProfile() {
  return readJSON(getPendrivePaths().profile, null);
}

function saveProfile(profile) {
  const identity = getIdentity();
  if (!identity) throw new Error("Identidade YAMI nao inicializada. Execute 'yami pendrive init'.");
  profile.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().profile, profile);
  markDirty("profile");
  return profile;
}

function getAppearance() {
  return readJSON(getPendrivePaths().appearance, null);
}

function saveAppearance(appearance) {
  const identity = getIdentity();
  if (!identity) throw new Error("Identidade YAMI nao inicializada.");
  appearance.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().appearance, appearance);
  markDirty("appearance");
  return appearance;
}

function setAppearance(key, value) {
  const current = getAppearance() || {};
  current[key] = value;
  return saveAppearance(current);
}

function getEvolution() {
  return readJSON(getPendrivePaths().evolution, null);
}

function saveEvolution(evolution) {
  evolution.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().evolution, evolution);
  markDirty("evolution");
  return evolution;
}

function registerEvolution(event) {
  const evolution = getEvolution();
  if (!evolution) throw new Error("Evolucao nao inicializada.");
  if (!Array.isArray(evolution.history)) evolution.history = [];
  evolution.history.push({
    id: `ev-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    yamiId: evolution.yamiId,
    type: event.type || "evolution",
    description: event.description || "",
    details: event.details || {},
    timestamp: new Date().toISOString(),
    generation: evolution.generation
  });
  evolution.totalEvolutions = evolution.history.length;
  evolution.lastEvolutionAt = new Date().toISOString();
  if (event.newStage) {
    evolution.currentStage = event.newStage;
    evolution.stages.push({
      id: event.newStage,
      name: event.stageName || event.newStage,
      description: event.stageDescription || "",
      unlockedAt: new Date().toISOString(),
      milestones: []
    });
  }
  return saveEvolution(evolution);
}

function getModules() {
  return readJSON(getPendrivePaths().modules, null);
}

function saveModules(modules) {
  modules.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().modules, modules);
  markDirty("modules");
  return modules;
}

function addCustomModule(moduleId, moduleName, moduleVersion) {
  const modules = getModules() || {};
  if (!Array.isArray(modules.custom)) modules.custom = [];
  modules.custom.push({
    id: moduleId,
    name: moduleName || moduleId,
    version: moduleVersion || "1.0",
    installedAt: new Date().toISOString()
  });
  modules.updatedAt = new Date().toISOString();
  return saveModules(modules);
}

function getVoiceSettings() {
  return readJSON(getPendrivePaths().voice, null);
}

function saveVoiceSettings(voice) {
  voice.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().voice, voice);
  markDirty("voice");
  return voice;
}

function getSync() {
  return readJSON(getPendrivePaths().sync, null);
}

function markDirty(section) {
  const sync = getSync() || { dirtyFlags: {} };
  if (!sync.dirtyFlags) sync.dirtyFlags = {};
  sync.dirtyFlags[section] = true;
  sync.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().sync, sync);
}

function markClean(section) {
  const sync = getSync() || { dirtyFlags: {} };
  if (!sync.dirtyFlags) sync.dirtyFlags = {};
  sync.dirtyFlags[section] = false;
  sync.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().sync, sync);
}

function recordSync() {
  const sync = getSync() || {};
  const identity = getIdentity();
  sync.yamiId = identity ? identity.yamiId : "";
  sync.lastSyncAt = new Date().toISOString();
  sync.lastHostName = require("os").hostname();
  sync.lastHostPlatform = process.platform;
  sync.lastHostUser = process.env.USERNAME || process.env.USER || "";
  if (!Array.isArray(sync.syncHistory)) sync.syncHistory = [];
  sync.syncHistory.push({
    at: sync.lastSyncAt,
    host: sync.lastHostName,
    platform: sync.lastHostPlatform
  });
  if (sync.syncHistory.length > 100) sync.syncHistory = sync.syncHistory.slice(-100);
  for (const key of Object.keys(sync.dirtyFlags || {})) {
    sync.dirtyFlags[key] = false;
  }
  sync.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().sync, sync);
}

function getSocialFriends() {
  return readJSON(getPendrivePaths().socialFriends, null);
}

function saveSocialFriends(data) {
  data.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().socialFriends, data);
  markDirty("social");
  return data;
}

function addFriend(friendYamiId, friendDisplayName, friendHandle) {
  const friends = getSocialFriends() || {};
  if (!Array.isArray(friends.friends)) friends.friends = [];
  if (friends.friends.find((f) => f.yamiId === friendYamiId)) {
    return { ok: false, message: "Amigo ja existe na lista." };
  }
  friends.friends.push({
    yamiId: friendYamiId,
    displayName: friendDisplayName || "Yami",
    handle: friendHandle || "",
    addedAt: new Date().toISOString(),
    status: "active",
    lastInteractionAt: null,
    sharedModules: [],
    sharedCustomizations: []
  });
  return { ok: true, friends: saveSocialFriends(friends) };
}

function removeFriend(friendYamiId) {
  const friends = getSocialFriends() || {};
  if (Array.isArray(friends.friends)) {
    friends.friends = friends.friends.filter((f) => f.yamiId !== friendYamiId);
  }
  return { ok: true, friends: saveSocialFriends(friends) };
}

function sendFriendRequest(friendYamiId, message) {
  const friends = getSocialFriends() || {};
  if (!Array.isArray(friends.pendingOutgoing)) friends.pendingOutgoing = [];
  if (friends.pendingOutgoing.find((f) => f.yamiId === friendYamiId)) {
    return { ok: false, message: "Convite ja enviado." };
  }
  friends.pendingOutgoing.push({
    yamiId: friendYamiId,
    sentAt: new Date().toISOString(),
    message: message || "",
    status: "pending"
  });
  saveSocialFriends(friends);
  return { ok: true, message: "Convite enviado." };
}

function acceptFriendRequest(friendYamiId) {
  const friends = getSocialFriends() || {};
  if (!Array.isArray(friends.pendingIncoming)) friends.pendingIncoming = [];
  const idx = friends.pendingIncoming.findIndex((f) => f.yamiId === friendYamiId);
  if (idx === -1) return { ok: false, message: "Nenhum convite pendente deste YAMI." };
  friends.pendingIncoming.splice(idx, 1);
  if (!Array.isArray(friends.friends)) friends.friends = [];
  if (!friends.friends.find((f) => f.yamiId === friendYamiId)) {
    friends.friends.push({
      yamiId: friendYamiId,
      displayName: friendYamiId,
      handle: "",
      addedAt: new Date().toISOString(),
      status: "active",
      lastInteractionAt: null,
      sharedModules: [],
      sharedCustomizations: []
    });
  }
  saveSocialFriends(friends);
  return { ok: true, message: "Convite aceito." };
}

function getProfileCard() {
  return readJSON(getPendrivePaths().socialProfileCard, null);
}

function saveProfileCard(card) {
  card.shareTimestamp = new Date().toISOString();
  writeJSON(getPendrivePaths().socialProfileCard, card);
  return card;
}

function generateProfileCard() {
  const identity = getIdentity();
  const profile = getProfile();
  const appearance = getAppearance();
  const evolution = getEvolution();
  if (!identity) throw new Error("Identidade nao encontrada.");
  const card = {
    yamiId: identity.yamiId,
    displayName: (profile && profile.displayName) || identity.instanceName || "Yami",
    handle: (profile && profile.socialHandle) || "",
    bio: (profile && profile.bio) || "",
    avatarStyle: (appearance && appearance.eyeStyle) || "default",
    glowColor: (appearance && appearance.glowColor) || "85, 230, 255",
    theme: (appearance && appearance.themePreset) || (profile && profile.theme) || "dark-neon",
    publicKey: identity.publicKey || "",
    generation: identity.generation || 1,
    evolutionStage: (evolution && evolution.currentStage) || "primordial",
    badges: (evolution && evolution.unlockedFeatures) || [],
    modulesVisible: [],
    shareTimestamp: new Date().toISOString(),
    cardVersion: 1
  };
  saveProfileCard(card);
  return card;
}

function sendMessage(toYamiId, text) {
  const msgs = readJSON(getPendrivePaths().socialMessages, { conversations: [] });
  if (!Array.isArray(msgs.conversations)) msgs.conversations = [];
  let conv = msgs.conversations.find((c) => c.withYamiId === toYamiId);
  if (!conv) {
    conv = {
      withYamiId: toYamiId,
      displayName: toYamiId,
      messages: [],
      createdAt: new Date().toISOString()
    };
    msgs.conversations.push(conv);
  }
  const msg = {
    id: `msg-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    direction: "outgoing",
    text,
    timestamp: new Date().toISOString(),
    read: false
  };
  conv.messages.push(msg);
  msgs.totalMessages = (msgs.totalMessages || 0) + 1;
  msgs.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().socialMessages, msgs);
  return msg;
}

function receiveMessage(fromYamiId, text) {
  const msgs = readJSON(getPendrivePaths().socialMessages, { conversations: [] });
  if (!Array.isArray(msgs.conversations)) msgs.conversations = [];
  let conv = msgs.conversations.find((c) => c.withYamiId === fromYamiId);
  if (!conv) {
    conv = {
      withYamiId: fromYamiId,
      displayName: fromYamiId,
      messages: [],
      createdAt: new Date().toISOString()
    };
    msgs.conversations.push(conv);
  }
  const msg = {
    id: `msg-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    direction: "incoming",
    text,
    timestamp: new Date().toISOString(),
    read: false
  };
  conv.messages.push(msg);
  msgs.totalMessages = (msgs.totalMessages || 0) + 1;
  msgs.unreadCount = (msgs.unreadCount || 0) + 1;
  msgs.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().socialMessages, msgs);
  return msg;
}

function getMessages(withYamiId) {
  const msgs = readJSON(getPendrivePaths().socialMessages, { conversations: [] });
  const conv = msgs.conversations.find((c) => c.withYamiId === withYamiId);
  return conv ? conv.messages : [];
}

function markMessagesRead(withYamiId) {
  const msgs = readJSON(getPendrivePaths().socialMessages, { conversations: [] });
  const conv = msgs.conversations.find((c) => c.withYamiId === withYamiId);
  if (conv) {
    for (const msg of conv.messages) {
      if (msg.direction === "incoming") msg.read = true;
    }
  }
  msgs.unreadCount = 0;
  msgs.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().socialMessages, msgs);
  return msgs;
}

function getMemoryEntries() {
  return readJSON(getPendrivePaths().memory, { entries: [] });
}

function addMemoryEntry(type, content, tags) {
  const memory = getMemoryEntries();
  if (!Array.isArray(memory.entries)) memory.entries = [];
  const entry = {
    id: `mem-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    type: type || "note",
    content,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    accessCount: 0
  };
  memory.entries.push(entry);
  if (memory.entries.length > (memory.maxEntries || 10000)) {
    memory.entries = memory.entries.slice(-memory.maxEntries);
  }
  memory.updatedAt = new Date().toISOString();
  writeJSON(getPendrivePaths().memory, memory);
  return entry;
}

function searchMemory(query) {
  const memory = getMemoryEntries();
  if (!Array.isArray(memory.entries)) return [];
  const q = query.toLowerCase();
  return memory.entries.filter((e) =>
    e.content.toLowerCase().includes(q) ||
    (e.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

function getFullStatus() {
  const identity = getIdentity();
  const profile = getProfile();
  const appearance = getAppearance();
  const evolution = getEvolution();
  const modules = getModules();
  const voice = getVoiceSettings();
  const sync = getSync();
  const friends = getSocialFriends();
  const profileCard = getProfileCard();
  const memory = getMemoryEntries();
  const msgs = readJSON(getPendrivePaths().socialMessages, { conversations: [] });

  return {
    ok: true,
    initialized: !!identity && !!identity.yamiId,
    pendrivePath: PENDRIVE_DIR,
    identity: identity ? {
      yamiId: identity.yamiId,
      instanceName: identity.instanceName,
      generation: identity.generation,
      createdAt: identity.createdAt
    } : null,
    profile: profile ? {
      displayName: profile.displayName,
      userName: profile.userName,
      theme: profile.theme
    } : null,
    appearance: appearance ? {
      glowColor: appearance.glowColor,
      eyeStyle: appearance.eyeStyle,
      accessory: appearance.accessory,
      themePreset: appearance.themePreset
    } : null,
    evolution: evolution ? {
      generation: evolution.generation,
      totalEvolutions: evolution.totalEvolutions,
      currentStage: evolution.currentStage,
      lastEvolutionAt: evolution.lastEvolutionAt,
      recentHistory: (evolution.history || []).slice(-10)
    } : null,
    modules: modules ? {
      native: (modules.native || []).length,
      custom: (modules.custom || []).length,
      shared: (modules.shared || []).length
    } : null,
    voice: voice || null,
    sync: sync ? {
      lastSyncAt: sync.lastSyncAt,
      lastHostName: sync.lastHostName,
      dirty: sync.dirtyFlags || {}
    } : null,
    social: {
      friends: friends ? {
        total: (friends.friends || []).length,
        incoming: (friends.pendingIncoming || []).length,
        outgoing: (friends.pendingOutgoing || []).length
      } : null,
      profileCard: profileCard || null,
      messages: {
        totalConversations: (msgs.conversations || []).length,
        totalMessages: msgs.totalMessages || 0,
        unreadCount: msgs.unreadCount || 0
      }
    },
    memory: memory ? {
      totalEntries: (memory.entries || []).length
    } : null
  };
}

function needsInit(paths, key) {
  const data = readJSON(paths[key], null);
  const identity = getIdentity();
  if (!data) return true;
  if (identity && data.yamiId !== identity.yamiId) return true;
  return false;
}

function initPendrive() {
  const identity = getOrCreateIdentity();
  const now = new Date().toISOString();
  const paths = getPendrivePaths();
  const pw = { profile: paths.profile, appearance: paths.appearance, evolution: paths.evolution, modules: paths.modules, voice: paths.voice, sync: paths.sync, socialFriends: paths.socialFriends, socialProfileCard: paths.socialProfileCard, socialMessages: paths.socialMessages, socialGroups: paths.socialGroups, memory: paths.memory };

  if (needsInit(pw, "profile")) {
    writeJSON(paths.profile, {
      yamiId: identity.yamiId,
      displayName: "Yami",
      userName: "",
      avatar: "default",
      bio: "",
      tags: [],
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      region: "BR",
      theme: "dark-neon",
      socialHandle: "",
      profileCardVersion: 1,
      updatedAt: now
    });
  }

  if (needsInit(pw, "appearance")) {
    writeJSON(paths.appearance, {
      yamiId: identity.yamiId,
      bodyColor: "#03070b",
      glowColor: "85, 230, 255",
      accentColor: "#55e6ff",
      eyeStyle: "default",
      eyeColor: "#6ab",
      mouthStyle: "default",
      accessory: null,
      animationSet: "default",
      themePreset: "dark-neon",
      bgEffect: "grid-scanlines",
      particles: true,
      customCss: "",
      scale: 1,
      brightness: 1,
      updatedAt: now
    });
  }

  if (needsInit(pw, "evolution")) {
    const birthId = `ev-birth-${Date.now().toString(36)}`;
    writeJSON(paths.evolution, {
      yamiId: identity.yamiId,
      generation: 1,
      totalEvolutions: 1,
      currentStage: "primordial",
      stages: [
        {
          id: "primordial",
          name: "Yami Primordial",
          description: "Primeira forma do Yami, recem-nascido",
          unlockedAt: now,
          milestones: [{ id: "nascimento", name: "Nascimento", description: "Yami foi iniciado pela primeira vez", unlockedAt: now }]
        }
      ],
      history: [
        {
          id: birthId,
          yamiId: identity.yamiId,
          type: "nascimento",
          description: "Yami foi inicializado com identidade pendrive",
          details: { version: "1.0.0-pendrive" },
          timestamp: now,
          generation: 1
        }
      ],
      unlockedFeatures: ["pendrive-nucleus"],
      modulesInstalled: 0,
      lastEvolutionAt: now,
      updatedAt: now
    });
  }

  if (needsInit(pw, "modules")) {
    writeJSON(paths.modules, {
      yamiId: identity.yamiId,
      native: [
        "voice", "dashboard", "gateway", "chats", "whatsapp",
        "integrations", "autoevolve", "comunicacao", "agenda-inteligente",
        "gerenciamento-arquivos", "gerenciamento-fotos", "compartilhamento-assistido"
      ],
      custom: [],
      shared: [],
      community: [],
      pendingInstall: [],
      updatedAt: now
    });
  }

  if (needsInit(pw, "voice")) {
    writeJSON(paths.voice, {
      yamiId: identity.yamiId,
      backend: "powershell",
      voice: "Microsoft Maria Desktop",
      model: "",
      rate: 0,
      volume: 100,
      wakeWord: "acorda",
      restWord: "descansa",
      language: "pt-BR",
      autoTts: false,
      ttsEnabled: false,
      updatedAt: now
    });
  }

  if (needsInit(pw, "sync")) {
    writeJSON(paths.sync, {
      yamiId: identity.yamiId,
      lastSyncAt: now,
      lastHostName: require("os").hostname(),
      lastHostPlatform: process.platform,
      lastHostUser: process.env.USERNAME || process.env.USER || "",
      syncVersion: "1.0",
      dirtyFlags: { profile: false, appearance: false, evolution: false, modules: false, voice: false, social: false, memory: false },
      syncHistory: [{ at: now, host: require("os").hostname(), platform: process.platform }],
      updatedAt: now
    });
  }

  if (needsInit(pw, "socialFriends")) {
    writeJSON(paths.socialFriends, {
      yamiId: identity.yamiId,
      friends: [],
      pendingIncoming: [],
      pendingOutgoing: [],
      blocked: [],
      maxFriends: 500,
      updatedAt: now
    });
  }

  if (needsInit(pw, "socialProfileCard")) {
    writeJSON(paths.socialProfileCard, {
      yamiId: identity.yamiId,
      displayName: "Yami",
      handle: "",
      bio: "",
      avatarStyle: "default",
      glowColor: "85, 230, 255",
      theme: "dark-neon",
      publicKey: "",
      generation: 1,
      evolutionStage: "primordial",
      badges: ["pendrive-nucleus"],
      modulesVisible: [],
      shareTimestamp: now,
      cardVersion: 1
    });
  }

  if (needsInit(pw, "socialMessages")) {
    writeJSON(paths.socialMessages, {
      yamiId: identity.yamiId,
      conversations: [],
      totalMessages: 0,
      unreadCount: 0,
      updatedAt: now
    });
  }

  if (needsInit(pw, "socialGroups")) {
    writeJSON(paths.socialGroups, {
      yamiId: identity.yamiId,
      groups: [],
      pendingInvites: [],
      updatedAt: now
    });
  }

  if (needsInit(pw, "memory")) {
    writeJSON(paths.memory, {
      version: 1,
      yamiId: identity.yamiId,
      entries: [],
      maxEntries: 10000,
      updatedAt: now
    });
  }

  recordSync();
  return getFullStatus();
}

function getExportBundle() {
  const identity = getIdentity();
  if (!identity) throw new Error("Pendrive nao inicializado.");
  return {
    exportedAt: new Date().toISOString(),
    origin: identity.yamiId,
    bundle: {
      identity: readJSON(getPendrivePaths().identity),
      profile: readJSON(getPendrivePaths().profile),
      appearance: readJSON(getPendrivePaths().appearance),
      evolution: readJSON(getPendrivePaths().evolution),
      modules: readJSON(getPendrivePaths().modules),
      voice: readJSON(getPendrivePaths().voice),
      socialProfileCard: readJSON(getPendrivePaths().socialProfileCard)
    }
  };
}

module.exports = {
  getOrCreateIdentity,
  getIdentity,
  getProfile,
  saveProfile,
  getAppearance,
  saveAppearance,
  setAppearance,
  getEvolution,
  saveEvolution,
  registerEvolution,
  getModules,
  saveModules,
  addCustomModule,
  getVoiceSettings,
  saveVoiceSettings,
  getSync,
  recordSync,
  markDirty,
  markClean,
  getSocialFriends,
  saveSocialFriends,
  addFriend,
  removeFriend,
  sendFriendRequest,
  acceptFriendRequest,
  getProfileCard,
  saveProfileCard,
  generateProfileCard,
  sendMessage,
  receiveMessage,
  getMessages,
  markMessagesRead,
  getMemoryEntries,
  addMemoryEntry,
  searchMemory,
  getFullStatus,
  initPendrive,
  getExportBundle,
  getPendrivePaths,
  PENDRIVE_DIR
};
