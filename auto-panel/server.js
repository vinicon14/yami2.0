const http = require("node:http");
const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
const { execFile, spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = Number(process.env.YAMI_PANEL_PORT || process.env.OPENCLAW_AUTO_PANEL_PORT || 18808);
const YAMI_HOME = process.env.YAMI_HOME || path.join(process.env.USERPROFILE || process.env.HOME || ".", ".yami");
process.env.YAMI_HOME = YAMI_HOME;
const YAMI_CONFIG_PATH = process.env.YAMI_CONFIG_PATH || path.join(YAMI_HOME, "yami.json");
process.env.YAMI_CONFIG_PATH = YAMI_CONFIG_PATH;
process.env.OPENCLAW_HOME = process.env.OPENCLAW_HOME || YAMI_HOME;
process.env.OPENCLAW_CONFIG_PATH = process.env.OPENCLAW_CONFIG_PATH || YAMI_CONFIG_PATH;
process.env.OPENCLAW_STATE_DIR = process.env.OPENCLAW_STATE_DIR || YAMI_HOME;
const YAMI_RUNTIME_HOME = YAMI_HOME;
const CONFIG_PATH = YAMI_CONFIG_PATH;
const CONFIG_BACKUP_PATH = path.join(YAMI_RUNTIME_HOME, "yami.json.auto-panel.bak");
const STATE_PATH = path.join(YAMI_RUNTIME_HOME, "auto-panel", "state.json");
const INDEX_PATH = path.join(__dirname, "public", "index.html");
const SESSIONS_PATH = path.join(YAMI_RUNTIME_HOME, "agents", "main", "sessions", "sessions.json");
const TTS_DIR = path.join(YAMI_RUNTIME_HOME, "auto-panel", "tts");
const LOCAL_TTS_SCRIPT = path.join(YAMI_RUNTIME_HOME, "auto-panel", "yami-local-tts.ps1");
const PYTTSX3_TTS_SCRIPT = path.join(YAMI_RUNTIME_HOME, "auto-panel", "yami-pyttsx3-tts.py");
const PIPER_TTS_SCRIPT = path.join(YAMI_RUNTIME_HOME, "auto-panel", "yami-piper-tts.py");
const DASHBOARD_URL = "http://127.0.0.1:18789/chat?session=agent%3Amain%3Ayami";
const CHROME_DEBUG_URL = process.env.YAMI_CHROME_DEBUG_URL || process.env.OPENCLAW_CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const CHROME_DEBUG_PORT = Number((CHROME_DEBUG_URL.match(/:(\d+)(?:\/|$)/) || [])[1] || 9222);
const CHROME_USER_DATA_DIR = path.join(YAMI_RUNTIME_HOME, "browser", "chrome", "user-data");
const ALWAYS_ALLOW_CONTACTS = ["+553599620901"];
const YAMI_WHATSAPP_NAME = "Yami";
const YAMI_SESSION_KEY = process.env.YAMI_SESSION_KEY || "agent:main:yami-voice";
const YAMI_PANEL_VERSION = "yami-native-runtime-20260608-4";
const YAMI_MANIFEST_PATH = path.join(YAMI_RUNTIME_HOME, "runtime", "yami-manifest.json");
const YAMI_MAX_MESSAGE_CHARS = 1800;
const YAMI_MAX_TTS_CHARS = 220;
const YAMI_TTS_VOICE = process.env.YAMI_TTS_VOICE || "";
const YAMI_TTS_MODEL = process.env.YAMI_TTS_MODEL || "";
const YAMI_TTS_BACKEND = process.env.YAMI_TTS_BACKEND || "powershell";
const PYTHON_EXE = process.env.PYTHON_EXE || "python";
const YAMI_AUDIO_PLAYBACK = process.env.YAMI_AUDIO_PLAYBACK || "yami";
const YAMI_AUTH_HOME = path.join(YAMI_RUNTIME_HOME, "auth");
const YAMI_AUTH_PROVIDERS_PATH = path.join(YAMI_AUTH_HOME, "providers", "registry.json");
const YAMI_AUTH_ACCOUNTS_PATH = path.join(YAMI_AUTH_HOME, "accounts.json");
const YAMI_AUTH_TOKENS_DIR = path.join(YAMI_AUTH_HOME, "tokens");
const YAMI_AGENT_TIMEOUT_SECONDS = Number(process.env.YAMI_AGENT_TIMEOUT_SECONDS || 15);
const YAMI_AGENT_PROCESS_TIMEOUT_MS = Number(process.env.YAMI_AGENT_PROCESS_TIMEOUT_MS || ((YAMI_AGENT_TIMEOUT_SECONDS + 5) * 1000));
const YAMI_FAST_MODEL = process.env.YAMI_FAST_MODEL || "gpt-4o-mini";
const YAMI_FAST_AI_TIMEOUT_MS = Number(process.env.YAMI_FAST_AI_TIMEOUT_MS || 6500);
const PENDRIVE = require(path.join(YAMI_HOME, "runtime", "pendrive-core.js"));
const NPM_BIN_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, "npm")
  : path.join(process.env.USERPROFILE || "", "AppData", "Roaming", "npm");
const OPENCLAW_ENTRYPOINT = process.env.YAMI_ENTRYPOINT
  || process.env.OPENCLAW_ENTRYPOINT
  || path.join(YAMI_HOME, "runtime", "core", "yami.mjs");

let restartState = {
  running: false,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastOk: null,
  lastMessage: ""
};
let audioPlaybackChain = Promise.resolve();
let activeAudioProcess = null;
let audioCancelToken = 0;
let audioQueueLength = 0;
let voiceUtteranceId = 0;
let lastNativeSpeakStopAt = 0;
const recentVoiceRequests = new Map();

const voiceRuntime = {
  awake: false,
  processing: false,
  speaking: false,
  speech: null,
  lastHeard: "",
  lastReply: "",
  lastAction: null,
  lastError: null,
  lastSpokenAt: null,
  lastUtteranceId: null
};

const DEFAULT_VOICE_SETTINGS = {
  backend: YAMI_TTS_BACKEND || "powershell",
  voice: YAMI_TTS_VOICE || "Microsoft Maria Desktop",
  model: YAMI_TTS_MODEL || "",
  rate: 0,
  volume: 100,
  referenceUrl: "https://github.com/isair/jarvis",
  referenceNote: "Referencia visual/conceitual para assistente local. A voz ativa continua sendo a voz Windows padrao.",
  nativeSpeak: false
};

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeContact(raw) {
  let value = String(raw || "").trim();
  if (!value) return "";
  value = value.replace(/^whatsapp:/i, "").trim();
  const jidMatch = value.match(/^(\d+)(?::\d+)?@(s\.whatsapp\.net|c\.us|lid)$/i);
  if (jidMatch) value = jidMatch[1];
  const digits = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  if (!digits) return "";
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeVoiceSettings(raw) {
  const settings = raw && typeof raw === "object" ? raw : {};
  const backend = String(settings.backend || DEFAULT_VOICE_SETTINGS.backend || "powershell").trim().toLowerCase();
  return {
    backend: ["powershell", "pyttsx3", "piper"].includes(backend) ? backend : "powershell",
    voice: String(settings.voice || DEFAULT_VOICE_SETTINGS.voice || "").trim(),
    model: String(settings.model || DEFAULT_VOICE_SETTINGS.model || "").trim(),
    rate: clampNumber(settings.rate, -10, 10, DEFAULT_VOICE_SETTINGS.rate),
    volume: clampNumber(settings.volume, 0, 100, DEFAULT_VOICE_SETTINGS.volume),
    referenceUrl: String(settings.referenceUrl || DEFAULT_VOICE_SETTINGS.referenceUrl).trim(),
    referenceNote: String(settings.referenceNote || DEFAULT_VOICE_SETTINGS.referenceNote).trim(),
    nativeSpeak: false
  };
}

function readState() {
  const state = readJsonFile(STATE_PATH, {});
  const blockedContacts = unique((Array.isArray(state.blockedContacts) ? state.blockedContacts : []).map(normalizeContact));
  return {
    enabled: state.enabled !== false,
    blockedContacts,
    voice: normalizeVoiceSettings(state.voice),
    updatedAt: state.updatedAt || null
  };
}

function saveState(next) {
  const previous = readJsonFile(STATE_PATH, {});
  const state = {
    enabled: next.enabled !== false,
    blockedContacts: unique((Array.isArray(next.blockedContacts) ? next.blockedContacts : []).map(normalizeContact)),
    voice: normalizeVoiceSettings(next.voice || previous.voice),
    updatedAt: new Date().toISOString()
  };
  writeJsonFile(STATE_PATH, state);
  return state;
}

function readConfig() {
  return readJsonFile(CONFIG_PATH, {});
}

function ensureWhatsAppConfig(cfg, enabled) {
  cfg.session = cfg.session || {};
  cfg.session.dmScope = "per-account-channel-peer";
  cfg.plugins = cfg.plugins || {};
  cfg.plugins.entries = cfg.plugins.entries || {};
  cfg.plugins.entries["tts-local-cli"] = cfg.plugins.entries["tts-local-cli"] || {};
  cfg.plugins.entries["tts-local-cli"].enabled = false;
  cfg.plugins.entries["talk-voice"] = cfg.plugins.entries["talk-voice"] || {};
  cfg.plugins.entries["talk-voice"].enabled = false;
  cfg.plugins.entries["voice-call"] = cfg.plugins.entries["voice-call"] || {};
  cfg.plugins.entries["voice-call"].enabled = false;
  if (Array.isArray(cfg.plugins.allow)) {
    cfg.plugins.allow = cfg.plugins.allow.filter((name) => !["talk-voice", "voice-call", "sherpa-onnx-tts", "tts-local-cli"].includes(String(name)));
  }
  cfg.skills = cfg.skills || {};
  cfg.skills.entries = cfg.skills.entries || {};
  for (const name of ["sherpa-onnx-tts", "voice-call", "talk-voice", "tts-local-cli"]) {
    cfg.skills.entries[name] = cfg.skills.entries[name] || {};
    cfg.skills.entries[name].enabled = false;
  }
  cfg.talk = cfg.talk || {};
  cfg.talk.enabled = false;
  cfg.talk.realtime = cfg.talk.realtime || {};
  cfg.talk.realtime.enabled = false;
  cfg.channels = cfg.channels || {};
  cfg.channels.whatsapp = cfg.channels.whatsapp || {};
  const whatsapp = cfg.channels.whatsapp;
  whatsapp.accounts = whatsapp.accounts || {};
  whatsapp.accounts.default = whatsapp.accounts.default || { name: YAMI_WHATSAPP_NAME };
  const account = whatsapp.accounts.default;

  const allowFrom = ALWAYS_ALLOW_CONTACTS;
  cfg.messages = cfg.messages || {};
  cfg.messages.responsePrefix = "";
  cfg.messages.tts = cfg.messages.tts || {};
  cfg.messages.tts.enabled = false;
  cfg.messages.tts.auto = "off";
  whatsapp.enabled = true;
  whatsapp.selfChatMode = true;
  whatsapp.responsePrefix = "";
  whatsapp.dmPolicy = "open";
  whatsapp.allowFrom = allowFrom;
  whatsapp.groupPolicy = "disabled";
  whatsapp.groupAllowFrom = [];
  whatsapp.replyToMode = "all";
  whatsapp.sendReadReceipts = true;
  whatsapp.reactionLevel = "off";
  whatsapp.debounceMs = typeof whatsapp.debounceMs === "number" ? whatsapp.debounceMs : 1200;
  whatsapp.historyLimit = typeof whatsapp.historyLimit === "number" ? whatsapp.historyLimit : 20;
  whatsapp.dmHistoryLimit = typeof whatsapp.dmHistoryLimit === "number" ? whatsapp.dmHistoryLimit : 20;
  whatsapp.mediaMaxMb = typeof whatsapp.mediaMaxMb === "number" ? whatsapp.mediaMaxMb : 50;
  whatsapp.ackReaction = whatsapp.ackReaction || { emoji: "OK", direct: true, group: "never" };
  whatsapp.ackReaction.direct = false;
  whatsapp.ackReaction.group = "never";

  account.name = YAMI_WHATSAPP_NAME;
  account.enabled = true;
  account.selfChatMode = true;
  account.responsePrefix = "";
  account.dmPolicy = "open";
  account.allowFrom = allowFrom;
  account.groupPolicy = "disabled";
  account.groupAllowFrom = [];
  account.replyToMode = "all";
  account.sendReadReceipts = true;
  account.reactionLevel = "off";
  account.debounceMs = typeof account.debounceMs === "number" ? account.debounceMs : 1200;
  account.historyLimit = typeof account.historyLimit === "number" ? account.historyLimit : 20;
  account.dmHistoryLimit = typeof account.dmHistoryLimit === "number" ? account.dmHistoryLimit : 20;
  account.mediaMaxMb = typeof account.mediaMaxMb === "number" ? account.mediaMaxMb : 50;

  return cfg;
}

function applyConfig(enabled) {
  const cfg = ensureWhatsAppConfig(readConfig(), enabled);
  try {
    if (fs.existsSync(CONFIG_PATH)) fs.copyFileSync(CONFIG_PATH, CONFIG_BACKUP_PATH);
  } catch {}
  writeJsonFile(CONFIG_PATH, cfg);
}

function runPowerShell(command, timeoutMs = 45000) {
  return new Promise((resolve) => {
    let settled = false;
    const child = execFile("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ], { windowsHide: true }, (error, stdout, stderr) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: !error,
        code: error && typeof error.code !== "undefined" ? error.code : 0,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        message: error ? String(error.message || error) : ""
      });
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch {}
      resolve({
        ok: false,
        code: "ETIMEDOUT",
        stdout: "",
        stderr: "",
        message: `Timeout depois de ${timeoutMs}ms`
      });
    }, timeoutMs);
  });
}

function runOpenClaw(args, timeoutMs = 45000) {
  return new Promise((resolve) => {
    let settled = false;
    const child = execFile(process.execPath, [OPENCLAW_ENTRYPOINT, ...args], { windowsHide: true }, (error, stdout, stderr) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: !error,
        code: error && typeof error.code !== "undefined" ? error.code : 0,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        message: error ? String(error.message || error) : ""
      });
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch {}
      resolve({
        ok: false,
        code: "ETIMEDOUT",
        stdout: "",
        stderr: "",
        message: `Timeout depois de ${timeoutMs}ms`
      });
    }, timeoutMs);
  });
}

function sanitizeYamiMessage(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, YAMI_MAX_MESSAGE_CHARS);
}

function sanitizeTtsText(raw) {
  let text = String(raw || "")
    .replace(/```[\s\S]*?```/g, "Codigo omitido.")
    .replace(/\s+/g, " ")
    .trim();
  const looksLikeCode = /(?:\b(function|const|let|var|class|import|export|return|def|SELECT|INSERT|UPDATE|DELETE)\b|[{}<>`]{2,}|=>|;\s*)/.test(text);
  const looksLikePromptDump = /(?:system prompt|systemPrompt|promptTokens|schemaHash|injectedWorkspaceFiles|ferramentas|tools\s*:)/i.test(text);
  if (looksLikeCode || looksLikePromptDump) {
    text = "Pronto. Nao vou ler codigo ou prompt longo em voz alta.";
  }
  if (text.length > YAMI_MAX_TTS_CHARS) {
    text = `${text.slice(0, YAMI_MAX_TTS_CHARS - 3).trimEnd()}...`;
  }
  return text;
}

function normalizeIntentText(raw) {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRestIntent(raw) {
  const normalized = normalizeIntentText(raw);
  if (!normalized) return false;
  const restWord = /\b(descan[sc](?:a|ar|e|o|ando)?\s*(?:yami|claw|clau)?|descanso\s*(?:yami|claw|clau)?|dorme\s*(?:yami|claw|clau)?|durma\s*(?:yami|claw|clau)?|pausa|pausar|parar de ouvir|pare de ouvir|para de ouvir|fica quieta|silencio)\b/;
  if (!restWord.test(normalized)) return false;
  return true;
}

function isWakeIntent(raw) {
  const normalized = normalizeIntentText(raw);
  if (!normalized) return false;
  const wakeWord = /\bacord[ae]?(?:\s*(?:yami|claw|clau))?\b/i;
  if (!wakeWord.test(normalized)) return false;
  return true;
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkTcpPort(port, host = HOST, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function fetchJsonWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function getChromeExe() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || "";
  const candidates = [
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    localAppData ? path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe") : ""
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || "";
}

function openDashboardForNativeSpeak() {
  const chrome = getChromeExe();
  if (!chrome) throw new Error("Chrome nao encontrado para abrir o Speak nativo.");
  fs.mkdirSync(CHROME_USER_DATA_DIR, { recursive: true });
  const args = [
    `--remote-debugging-port=${CHROME_DEBUG_PORT}`,
    `--user-data-dir=${CHROME_USER_DATA_DIR}`,
    "--window-size=1420,960",
    "--window-position=20,20",
    "--no-first-run",
    "--no-default-browser-check",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    DASHBOARD_URL
  ];
  const child = spawn(chrome, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: false
  });
  child.unref();
}

function getWebSocketConstructor() {
  if (typeof WebSocket !== "undefined") return WebSocket;
  try {
    return require("ws");
  } catch {
    return null;
  }
}

async function getDashboardTarget(options = {}) {
  const allowOpen = Boolean(options.allowOpen);
  const findTarget = (targets) => Array.isArray(targets)
    ? targets.find((target) => target && target.type === "page" && /127\.0\.0\.1:18789/.test(String(target.url || "")) && target.webSocketDebuggerUrl)
    : null;

  const readTarget = async () => {
    try {
      return findTarget(await fetchJsonWithTimeout(`${CHROME_DEBUG_URL}/json/list`, 1200));
    } catch {
      return null;
    }
  };

  let target = await readTarget();
  if (target) return target;
  if (!allowOpen) {
    throw new Error("Dashboard Yami nao esta aberto.");
  }

  openDashboardForNativeSpeak();
  for (let i = 0; i < 24; i += 1) {
    await wait(250);
    target = await readTarget();
    if (target) return target;
  }

  throw new Error("Nao consegui abrir o dashboard Yami.");
}

async function evaluateInDashboard(expression, timeoutMs = 6000, options = {}) {
  const target = await getDashboardTarget(options);
  const WebSocketCtor = getWebSocketConstructor();
  if (!WebSocketCtor) throw new Error("WebSocket nao disponivel no Node.");

  const socket = new WebSocketCtor(target.webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();

  const cleanup = () => {
    try { socket.close(); } catch {}
  };

  const parseMessage = (data) => {
    try {
      return JSON.parse(typeof data === "string" ? data : data.toString());
    } catch {
      return null;
    }
  };

  const handleMessage = (data) => {
    const message = parseMessage(data && data.data !== undefined ? data.data : data);
    if (!message || !message.id || !pending.has(message.id)) return;
    const { resolve, reject, timer } = pending.get(message.id);
    clearTimeout(timer);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
    else resolve(message.result);
  };

  const opened = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout ao conectar no dashboard.")), timeoutMs);
    const finish = (fn, value) => {
      clearTimeout(timer);
      fn(value);
    };
    if (typeof socket.addEventListener === "function") {
      socket.addEventListener("open", () => finish(resolve));
      socket.addEventListener("error", () => finish(reject, new Error("Falha no Chrome DevTools.")));
      socket.addEventListener("message", handleMessage);
    } else {
      socket.once("open", () => finish(resolve));
      socket.once("error", (error) => finish(reject, error || new Error("Falha no Chrome DevTools.")));
      socket.on("message", handleMessage);
    }
  });

  function call(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, {
        resolve,
        reject,
        timer: setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timeout em ${method}.`));
        }, timeoutMs)
      });
      try {
        socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        const entry = pending.get(id);
        if (entry) clearTimeout(entry.timer);
        pending.delete(id);
        reject(error);
      }
    });
  }

  try {
    await opened;
    await call("Runtime.enable");
    await call("Page.bringToFront").catch(() => {});
    const result = await call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return result && result.result ? result.result.value : null;
  } finally {
    cleanup();
  }
}

async function activateNativeClawSpeak(options = {}) {
  const result = await evaluateInDashboard(`(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (probe, timeoutMs = 6500) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const value = probe();
        if (value) return value;
        await sleep(180);
      }
      return probe();
    };
    const app = await waitFor(() => document.querySelector("openclaw-app"));
    if (app) {
      await waitFor(() => app.client && app.connected, 8500);
      if (!app.client || !app.connected) {
        return {
          ok: false,
          active: false,
          message: app.lastError || app.chatError || "Dashboard abriu, mas ainda nao conectou ao gateway.",
          status: app.realtimeTalkStatus,
          url: location.href
        };
      }
      const session = app.realtimeTalkSession;
      const closed = Boolean(session && session.transport && session.transport.closed);
      const stale = session && (!app.realtimeTalkActive || app.realtimeTalkStatus === "idle" || closed);
      if (stale) {
        try { session.stop(); } catch {}
        app.realtimeTalkSession = null;
        app.realtimeTalkActive = false;
        app.realtimeTalkStatus = "idle";
        app.realtimeTalkDetail = null;
        app.realtimeTalkTranscript = null;
        try { app.resetRealtimeTalkConversation(); } catch {}
        await sleep(220);
      }
      const isReadyStatus = (status) => status === "listening" || status === "thinking";
      if (app.realtimeTalkSession && app.realtimeTalkActive && isReadyStatus(app.realtimeTalkStatus) && !(app.realtimeTalkSession.transport && app.realtimeTalkSession.transport.closed)) {
        return { ok: true, active: true, alreadyActive: true, status: app.realtimeTalkStatus, url: location.href };
      }
      const relayErrors = [];
      const unsubscribe = app.client && typeof app.client.addEventListener === "function"
        ? app.client.addEventListener((event) => {
            try {
              if (event && event.event === "talk.event" && event.payload && event.payload.type === "error") {
                relayErrors.push(String(event.payload.message || "Erro no realtime da Yami."));
              }
            } catch {}
          })
        : null;
      try {
        app.updateRealtimeTalkOptions?.({ transport: "gateway-relay", voice: "marin", model: "gpt-realtime-2" });
        await app.toggleRealtimeTalk();
        await waitFor(() => {
          const session = app.realtimeTalkSession;
          const closed = Boolean(session && session.transport && session.transport.closed);
          return app.realtimeTalkStatus === "error" || isReadyStatus(app.realtimeTalkStatus) || closed || relayErrors.length > 0 || app.realtimeTalkStatus === "idle";
        }, 10000);
        const nextSession = app.realtimeTalkSession;
        const closed = Boolean(nextSession && nextSession.transport && nextSession.transport.closed);
        const relayError = relayErrors[relayErrors.length - 1] || "";
        const active = Boolean(nextSession && app.realtimeTalkActive && isReadyStatus(app.realtimeTalkStatus) && !closed);
        const message = active
          ? ""
          : relayError || app.realtimeTalkDetail || (closed ? "Yami fechou o Speak antes de ficar pronto." : "Speak nao saiu de connecting.");
        return {
          ok: active,
          active,
          clicked: false,
          status: app.realtimeTalkStatus,
          detail: app.realtimeTalkDetail || "",
          message,
          url: location.href
        };
      } catch (error) {
        return { ok: false, active: false, message: String(error && error.message || error), url: location.href };
      } finally {
        try { unsubscribe && unsubscribe(); } catch {}
      }
    }
    const labelFor = (el) => [
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.textContent
    ].filter(Boolean).join(" ").replace(/\\s+/g, " ").trim();
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const buttons = () => Array.from(document.querySelectorAll("button, [role='button']"))
      .filter((button) => visible(button) && !button.disabled);
    const isStop = (button) => /\\bstop\\s*talk\\b|\\bparar\\s*talk\\b|\\bencerrar\\s*talk\\b/i.test(labelFor(button));
    const alreadyActive = buttons().find(isStop);
    if (alreadyActive) {
      return { ok: true, active: true, alreadyActive: true, label: labelFor(alreadyActive), url: location.href };
    }
    const start = await waitFor(() => buttons().find((button) => {
      const label = labelFor(button);
      if (/settings|config|attach|send|session|theme|file/i.test(label)) return false;
      return /\\bstart\\s*talk\\b|\\biniciar\\s*talk\\b|\\bcomecar\\s*talk\\b|\\bcomeçar\\s*talk\\b|\\bligar\\s*talk\\b|\\bstart\\s*speak\\b/i.test(label);
    }));
    if (!start) {
      return { ok: false, active: false, message: "Botao Start Talk nao encontrado.", url: location.href };
    }
    start.scrollIntoView({ block: "center", inline: "center" });
    start.click();
    return new Promise((resolve) => {
      setTimeout(() => {
        const active = buttons().some(isStop);
        resolve({
          ok: true,
          active,
          clicked: true,
          label: labelFor(start),
          error: "",
          url: location.href
        });
      }, 140);
    });
  })()`, 12000, { allowOpen: Boolean(options.allowOpen) });

  if (!result || result.ok === false || result.active === false) {
    return {
      ok: false,
      active: false,
      message: result && (result.message || result.error) ? (result.message || result.error) : "Speak nativo indisponivel.",
      url: result && result.url ? result.url : DASHBOARD_URL
    };
  }

  return {
    ok: true,
    active: Boolean(result.active),
    alreadyActive: Boolean(result.alreadyActive),
    message: result.alreadyActive ? "Speak nativo ja estava ativo." : "Speak nativo acionado.",
    status: result.status || null,
    detail: result.detail || null,
    url: result.url || DASHBOARD_URL
  };
}

async function deactivateNativeClawSpeak() {
  const result = await evaluateInDashboard(`(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const app = document.querySelector("openclaw-app");
    if (app) {
      const wasActive = Boolean(app.realtimeTalkSession && app.realtimeTalkActive && app.realtimeTalkStatus !== "idle");
      try {
        if (wasActive && typeof app.toggleRealtimeTalk === "function") {
          await app.toggleRealtimeTalk();
        } else if (app.realtimeTalkSession && typeof app.realtimeTalkSession.stop === "function") {
          app.realtimeTalkSession.stop();
        }
      } catch {}
      try {
        if (app.realtimeTalkSession && typeof app.realtimeTalkSession.stop === "function") {
          app.realtimeTalkSession.stop();
        }
      } catch {}
      app.realtimeTalkSession = null;
      app.realtimeTalkActive = false;
      app.realtimeTalkStatus = "idle";
      app.realtimeTalkDetail = null;
      app.realtimeTalkTranscript = null;
      try { app.resetRealtimeTalkConversation(); } catch {}
      await sleep(160);
      return { ok: true, active: false, wasActive, status: app.realtimeTalkStatus, url: location.href };
    }

    const labelFor = (el) => [
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.textContent
    ].filter(Boolean).join(" ").replace(/\\s+/g, " ").trim();
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const stop = Array.from(document.querySelectorAll("button, [role='button']"))
      .filter((button) => visible(button) && !button.disabled)
      .find((button) => /\\bstop\\s*talk\\b|\\bparar\\s*talk\\b|\\bencerrar\\s*talk\\b/i.test(labelFor(button)));
    if (!stop) return { ok: true, active: false, alreadyStopped: true, url: location.href };
    stop.click();
    await sleep(160);
    return { ok: true, active: false, clicked: true, label: labelFor(stop), url: location.href };
  })()`);

  if (!result || result.ok === false) {
    return {
      ok: false,
      active: false,
      message: result && (result.message || result.error) ? (result.message || result.error) : "Nao consegui desligar o Speak nativo.",
      url: result && result.url ? result.url : DASHBOARD_URL
    };
  }

  return {
    ok: true,
    active: false,
    alreadyStopped: Boolean(result.alreadyStopped),
    message: result.alreadyStopped ? "Speak nativo ja estava parado." : "Speak nativo desligado.",
    status: result.status || null,
    url: result.url || DASHBOARD_URL
  };
}

function detectLocalAction(message) {
  const normalized = normalizeIntentText(message);
  const wantsOpen = /\b(abrir|abre|abra|abrindo|iniciar|inicia|inicie|executar|executa|ligar|liga|open)\b/.test(normalized);
  if (wantsOpen && /\b(spotify|spotfy|spotifi)\b/.test(normalized)) {
    return {
      id: "open_spotify",
      label: "Abrir Spotify",
      type: "open_url",
      target: "spotify:",
      spoken: "Abrindo Spotify."
    };
  }
  if (wantsOpen && /\b(youtube|you tube)\b/.test(normalized)) {
    return {
      id: "open_youtube",
      label: "Abrir YouTube",
      type: "open_url",
      target: "https://www.youtube.com/",
      spoken: "Abrindo YouTube."
    };
  }
  if (wantsOpen && /\b(google|chrome|navegador|browser)\b/.test(normalized)) {
    return {
      id: "open_browser",
      label: "Abrir navegador",
      type: "open_url",
      target: "https://www.google.com/",
      spoken: "Abrindo navegador."
    };
  }
  if (wantsOpen && /\b(whatsapp|zap|watsap)\b/.test(normalized)) {
    return {
      id: "open_whatsapp",
      label: "Abrir WhatsApp",
      type: "open_url",
      target: "https://web.whatsapp.com/",
      spoken: "Abrindo WhatsApp."
    };
  }
  if (wantsOpen && /\b(calculadora|calculator|calc)\b/.test(normalized)) {
    return {
      id: "open_calculator",
      label: "Abrir calculadora",
      type: "start_process",
      target: "calc.exe",
      spoken: "Abrindo calculadora."
    };
  }
  if (wantsOpen && /\b(bloco de notas|notepad|anotacoes|notas)\b/.test(normalized)) {
    return {
      id: "open_notepad",
      label: "Abrir bloco de notas",
      type: "start_process",
      target: "notepad.exe",
      spoken: "Abrindo bloco de notas."
    };
  }
  if (wantsOpen && /\b(explorador|arquivos|pasta|file explorer)\b/.test(normalized)) {
    return {
      id: "open_explorer",
      label: "Abrir explorador",
      type: "start_process",
      target: "explorer.exe",
      spoken: "Abrindo arquivos."
    };
  }
  if (wantsOpen && /\b(painel yami|yami control|controle yami)\b/.test(normalized)) {
    return {
      id: "open_yami_panel",
      label: "Abrir painel Yami",
      type: "open_url",
      target: "http://127.0.0.1:18808/?voice=1",
      spoken: "Abrindo painel do Yami."
    };
  }
  if (wantsOpen && /\b(dashboard|painel yami|painel claw|painel openclaw|openclaw|yami)\b/.test(normalized)) {
    return {
      id: "open_yami_dashboard",
      label: "Abrir dashboard Yami",
      type: "open_url",
      target: "http://127.0.0.1:18789/",
      spoken: "Abrindo dashboard."
    };
  }
  if (/\b(status|situacao|estado)\b/.test(normalized) && /\b(gateway|whatsapp|openclaw|claw|yami)\b/.test(normalized)) {
    return {
      id: "status_yami",
      label: "Status Yami",
      type: "status",
      spoken: "Conferindo status."
    };
  }
  return null;
}

function detectInstantReply(message) {
  const normalized = normalizeIntentText(message);
  if (!normalized) return null;
  if (/^(acordei|acorde|acorda|oi|ola|e ai|yami|claw)\b/.test(normalized) || /\b(acorda|acorde)\s*(yami|claw)?\b/.test(normalized)) {
    return "Estou ouvindo.";
  }
  if (/\b(voce esta ai|ta ai|esta online|status|funcionando)\b/.test(normalized)) {
    return "Estou online.";
  }
  if (/\b(ta me ouvindo|esta me ouvindo|me ouve|me escuta)\b/.test(normalized)) {
    return "Estou ouvindo.";
  }
  if (/\b(fala comigo|conversa comigo|pode falar|vamos conversar)\b/.test(normalized)) {
    return "Pode falar.";
  }
  if (/^(ok|sim|nao|obrigado|obrigada|valeu|beleza)\b/.test(normalized)) {
    return "Certo.";
  }
  return null;
}

async function runLocalAction(action) {
  if (action.type === "open_url") {
    const command = `Start-Process ${psSingleQuote(action.target)}`;
    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    return {
      id: action.id,
      label: action.label,
      ok: true,
      spoken: action.spoken,
      message: action.spoken
    };
  }

  if (action.type === "start_process") {
    const child = spawn(action.target, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.unref();
    return {
      id: action.id,
      label: action.label,
      ok: true,
      spoken: action.spoken,
      message: action.spoken
    };
  }

  if (action.type === "status") {
    const [gatewayOk, panelOk] = await Promise.all([
      checkTcpPort(18789),
      checkTcpPort(PORT)
    ]);
    const spoken = gatewayOk
      ? "Gateway ativo."
      : "Gateway sem resposta.";
    return {
      id: action.id,
      label: action.label,
      ok: gatewayOk,
      spoken,
      message: panelOk ? spoken : `${spoken} Painel Yami instavel.`
    };
  }

  return {
    id: action.id,
    label: action.label,
    ok: false,
    spoken: "Nao consegui executar.",
    message: "Tipo de acao local desconhecido."
  };
}

function cleanupOldTtsFiles() {
  try {
    fs.mkdirSync(TTS_DIR, { recursive: true });
    const cutoff = Date.now() - (1000 * 60 * 60 * 6);
    for (const entry of fs.readdirSync(TTS_DIR)) {
      if (!entry.endsWith(".mp3") && !entry.endsWith(".wav")) continue;
      const fullPath = path.join(TTS_DIR, entry);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs < cutoff) fs.unlinkSync(fullPath);
    }
  } catch {}
}

function getVoiceMode() {
  if (voiceRuntime.processing) return "processing";
  if (voiceRuntime.speaking || audioQueueLength > 0) return "speaking";
  if (!voiceRuntime.awake) return "asleep";
  return "awake";
}

function estimateSpeechDurationMs(rawText) {
  const text = sanitizeTtsText(rawText);
  if (!text) return 900;
  const words = text.split(/\s+/).filter(Boolean).length;
  const byWords = words * 420;
  const byChars = text.length * 55;
  return Math.max(1100, Math.min(15000, Math.round(Math.max(byWords, byChars))));
}

function getAvatarMood(mode = getVoiceMode()) {
  if (voiceRuntime.lastError && Date.now() - Date.parse(voiceRuntime.lastSpokenAt || 0) < 8000) return "error";
  if (mode === "processing") return "processing";
  if (mode === "speaking") return "speaking";
  if (mode === "awake") return "talk";
  return "passive";
}

function getSpeechState() {
  const speech = voiceRuntime.speech;
  if (!speech) return null;
  const startedMs = Date.parse(speech.startedAt || "");
  const endedMs = Date.parse(speech.endedAt || "");
  const now = Date.now();
  if (speech.event === "speech.end" && endedMs && now - endedMs > 3500) return null;
  const elapsedMs = Number.isFinite(startedMs) ? Math.max(0, now - startedMs) : 0;
  return {
    ...speech,
    elapsedMs,
    active: speech.event !== "speech.end" && !speech.endedAt,
    progress: speech.estimatedDurationMs
      ? Math.max(0, Math.min(1, elapsedMs / speech.estimatedDurationMs))
      : 0
  };
}

function getVoiceState() {
  const mode = getVoiceMode();
  const voiceSettings = getActiveVoiceSettings();
  return {
    mode,
    avatarMood: getAvatarMood(mode),
    awake: voiceRuntime.awake,
    processing: voiceRuntime.processing,
    speaking: voiceRuntime.speaking,
    queueLength: audioQueueLength,
    playback: "yami-local",
    ttsBackend: voiceSettings.backend,
    voiceSettings,
    nativeSpeak: "disabled",
    lastHeard: voiceRuntime.lastHeard,
    lastReply: voiceRuntime.lastReply,
    lastAction: voiceRuntime.lastAction,
    lastError: voiceRuntime.lastError,
    lastSpokenAt: voiceRuntime.lastSpokenAt,
    lastUtteranceId: voiceRuntime.lastUtteranceId,
    speech: getSpeechState()
  };
}

function getActiveVoiceSettings() {
  return readState().voice;
}

function maybeStopNativeClawSpeak() {
  const now = Date.now();
  if (now - lastNativeSpeakStopAt < 60000) return;
  lastNativeSpeakStopAt = now;
  deactivateNativeClawSpeak().catch(() => {});
}

function wakeVoiceRuntime(message = "") {
  voiceRuntime.awake = true;
  voiceRuntime.lastHeard = sanitizeYamiMessage(message);
  voiceRuntime.lastError = null;
}

function stopVoiceRuntime(reason = "descansa", playAck = false) {
  if (playAck) {
    generateOpenClawSpeech("Descansando.", { allowWhileAsleep: true }).catch(() => {});
  }
  audioCancelToken += 1;
  audioQueueLength = 0;
  audioPlaybackChain = Promise.resolve();
  if (activeAudioProcess) {
    try { activeAudioProcess.kill(); } catch {}
    activeAudioProcess = null;
  }
  voiceRuntime.awake = false;
  voiceRuntime.processing = false;
  voiceRuntime.speaking = false;
  voiceRuntime.speech = {
    event: "speech.end",
    utteranceId: voiceRuntime.lastUtteranceId,
    text: voiceRuntime.lastReply,
    startedAt: voiceRuntime.speech && voiceRuntime.speech.startedAt,
    endedAt: new Date().toISOString(),
    estimatedDurationMs: estimateSpeechDurationMs(voiceRuntime.lastReply),
    reason
  };
  voiceRuntime.lastAction = { id: "sleep", label: "Descansar", ok: true, reason };
  voiceRuntime.lastReply = "Yami pausada.";
  deactivateNativeClawSpeak().catch(() => {});
  return getVoiceState();
}

function runTtsProcess(command, args, label, timeoutMs = 10000, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = execFile(command, args, {
      windowsHide: true,
      timeout: timeoutMs,
      env: { ...process.env, ...extraEnv }
    }, (error, stdout, stderr) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        return reject(new Error((stderr || stdout || error.message || `${label} falhou.`).trim()));
      }
      resolve();
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch {}
      reject(new Error(`${label} demorou demais.`));
    }, timeoutMs);
  });
}

async function createOpenClawSpeechFile(rawText) {
  const text = sanitizeTtsText(rawText);
  if (!text) throw new Error("Texto de fala vazio.");
  const voiceSettings = getActiveVoiceSettings();
  const backend = voiceSettings.backend || "powershell";
  cleanupOldTtsFiles();
  fs.mkdirSync(TTS_DIR, { recursive: true });
  const fileName = `yami-${Date.now()}-${Math.random().toString(16).slice(2)}.wav`;
  const outputPath = path.join(TTS_DIR, fileName);
  const errors = [];
  if (backend === "piper" && fs.existsSync(PIPER_TTS_SCRIPT)) {
    try {
      await runTtsProcess(PYTHON_EXE, [
        PIPER_TTS_SCRIPT,
        "--text",
        text,
        "--output",
        outputPath,
        "--voice",
        voiceSettings.model || voiceSettings.voice || "pt_BR-faber-medium"
      ], "TTS Piper", 90000);
    } catch (error) {
      errors.push(String(error && error.message || error));
    }
  }

  if ((!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) && backend === "pyttsx3" && fs.existsSync(PYTTSX3_TTS_SCRIPT)) {
    try {
      await runTtsProcess(PYTHON_EXE, [
        PYTTSX3_TTS_SCRIPT,
        "--text",
        text,
        "--output",
        outputPath
      ], "TTS pyttsx3", 12000, {
        YAMI_PYTTSX3_VOICE: voiceSettings.voice || "",
        YAMI_PYTTSX3_RATE: String(150 + (Number(voiceSettings.rate || 0) * 12)),
        YAMI_PYTTSX3_VOLUME: String(Math.max(0, Math.min(1, Number(voiceSettings.volume || 100) / 100)))
      });
    } catch (error) {
      errors.push(String(error && error.message || error));
    }
  }

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    try {
      await runTtsProcess("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        LOCAL_TTS_SCRIPT,
        "-Text",
        text,
        "-OutputPath",
        outputPath,
        "-Voice",
        voiceSettings.voice || "",
        "-Rate",
        String(voiceSettings.rate || 0),
        "-Volume",
        String(voiceSettings.volume || 100)
      ], "TTS PowerShell", 8000);
    } catch (error) {
      errors.push(String(error && error.message || error));
    }
  }

  if (!fs.existsSync(outputPath)) throw new Error("Yami nao gerou audio.");
  if (fs.statSync(outputPath).size === 0) throw new Error(`Yami gerou audio vazio. ${errors.join(" | ")}`.trim());
  return { outputPath, fileName, text };
}

function playOpenClawAudioFile(filePath, token) {
  return new Promise((resolve, reject) => {
    if (token !== audioCancelToken) return resolve({ ok: false, cancelled: true });
    const command = [
      "$ErrorActionPreference = 'Stop'",
      "$player = New-Object System.Media.SoundPlayer",
      `$player.SoundLocation = ${psSingleQuote(filePath)}`,
      "$player.Load()",
      "$player.PlaySync()"
    ].join("; ");
    activeAudioProcess = execFile("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ], { windowsHide: true, timeout: 15000 }, (error, stdout, stderr) => {
      activeAudioProcess = null;
      if (token !== audioCancelToken) return resolve({ ok: false, cancelled: true });
      if (error) return reject(new Error((stderr || stdout || error.message || "Falha ao tocar audio local.").trim()));
      resolve({ ok: true });
    });
  });
}

function queueOpenClawSpeech(rawText, options = {}) {
  const text = sanitizeTtsText(rawText);
  if (!text) throw new Error("Texto de fala vazio.");
  const voiceSettings = getActiveVoiceSettings();
  const utteranceId = ++voiceUtteranceId;
  const token = audioCancelToken;
  const allowWhileAsleep = options.allowWhileAsleep === true;
  const estimatedDurationMs = estimateSpeechDurationMs(text);
  audioQueueLength += 1;
  voiceRuntime.lastReply = text;
  voiceRuntime.lastSpokenAt = new Date().toISOString();
  voiceRuntime.lastUtteranceId = utteranceId;

  const playbackJob = audioPlaybackChain.catch(() => {}).then(async () => {
    let speechStartedAt = "";
    try {
      if (token !== audioCancelToken || (!voiceRuntime.awake && !allowWhileAsleep)) {
        return { ok: false, cancelled: true };
      }
      maybeStopNativeClawSpeak();
      voiceRuntime.speaking = true;
      speechStartedAt = new Date().toISOString();
      voiceRuntime.speech = {
        event: "speech.start",
        utteranceId,
        text,
        startedAt: speechStartedAt,
        estimatedDurationMs,
        backend: voiceSettings.backend,
        playback: "yami-local"
      };
      const audio = await createOpenClawSpeechFile(text);
      if (token !== audioCancelToken || (!voiceRuntime.awake && !allowWhileAsleep)) {
        return { ok: false, cancelled: true };
      }
      await playOpenClawAudioFile(audio.outputPath, token);
      return { ok: true };
    } catch (error) {
      voiceRuntime.lastError = String(error && error.message || error);
      return { ok: false, message: voiceRuntime.lastError };
    } finally {
      audioQueueLength = Math.max(0, audioQueueLength - 1);
      if (token === audioCancelToken) {
        voiceRuntime.speaking = false;
        voiceRuntime.speech = {
          event: "speech.end",
          utteranceId,
          text,
          startedAt: speechStartedAt || (voiceRuntime.speech && voiceRuntime.speech.startedAt),
          endedAt: new Date().toISOString(),
          estimatedDurationMs,
          backend: voiceSettings.backend,
          playback: "yami-local"
        };
      }
    }
  });
  audioPlaybackChain = playbackJob.catch(() => {});
  return {
    ok: true,
    voice: voiceSettings.voice,
    backend: voiceSettings.backend,
    playback: "yami",
    queued: true,
    utteranceId,
    text,
    estimatedDurationMs,
    queueLength: audioQueueLength,
    audioUrl: null
  };
}

async function generateOpenClawSpeech(rawText, options = {}) {
  return queueOpenClawSpeech(rawText, options);
}

function extractYamiText(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    const payloads = parsed && parsed.result && Array.isArray(parsed.result.payloads)
      ? parsed.result.payloads
      : [];
    const fromPayloads = payloads.map((payload) => payload && payload.text).filter(Boolean).join("\n").trim();
    if (fromPayloads) return fromPayloads;
    if (parsed.finalAssistantVisibleText) return String(parsed.finalAssistantVisibleText).trim();
    if (parsed.result && parsed.result.finalAssistantVisibleText) return String(parsed.result.finalAssistantVisibleText).trim();
  } catch {}
  return text;
}

function cleanYamiReply(raw, fallback = "Feito.") {
  let reply = String(raw || "").trim();
  if (!reply) return fallback;

  const internalNoise = [
    /systemPromptReport/i,
    /injectedWorkspaceFiles/i,
    /schemaHash/i,
    /summaryHash/i,
    /promptTokens/i,
    /rawChars/i,
    /"tools"\s*:/i,
    /"systemPrompt"\s*:/i,
    /"executionTrace"\s*:/i,
    /"requestShaping"\s*:/i
  ];
  if (internalNoise.some((pattern) => pattern.test(reply))) return fallback;
  if ((reply.startsWith("{") || reply.startsWith("[")) && reply.length > 260) return fallback;

  reply = reply
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const codeOrPrompt = /(?:```|`[^`]+`|\b(function|const|let|var|class|import|export|return|def)\b|systemPrompt|promptTokens|schemaHash|tools\s*:)/i;
  if (codeOrPrompt.test(reply)) return "Pronto. Nao vou ler codigo ou prompt longo em voz alta.";

  const sentences = reply.match(/[^.!?]+[.!?]?/g) || [reply];
  reply = sentences.slice(0, 1).join(" ").trim();
  if (reply.length > 140) reply = `${reply.slice(0, 137).trimEnd()}...`;
  return reply || fallback;
}

async function askYami(rawMessage) {
  const startedAt = Date.now();
  const message = sanitizeYamiMessage(rawMessage);
  if (!message) throw new Error("Mensagem vazia.");
  const requestKey = normalizeIntentText(message);
  if (isRestIntent(message)) {
    const voice = stopVoiceRuntime("voz", true);
    return {
      reply: "Descansando.",
      action: { id: "sleep", label: "Descansar", ok: true },
      tts: null,
      timings: {
        totalMs: Date.now() - startedAt,
        actionMs: 0,
        agentMs: 0
      },
      voice
    };
  }
  const recent = requestKey ? recentVoiceRequests.get(requestKey) : null;
  if (recent && Date.now() - recent.at < 6500) {
    return {
      ok: true,
      reply: recent.reply || voiceRuntime.lastReply || "Ja estou processando.",
      action: recent.action || null,
      tts: null,
      deduped: true,
      timings: {
        totalMs: Date.now() - startedAt,
        actionMs: 0,
        agentMs: 0
      },
      voice: getVoiceState()
    };
  }
  if (requestKey) {
    recentVoiceRequests.set(requestKey, { at: Date.now(), reply: "", action: null });
    for (const [key, value] of recentVoiceRequests.entries()) {
      if (!value || Date.now() - value.at > 30000) recentVoiceRequests.delete(key);
    }
  }
  wakeVoiceRuntime(message);
  voiceRuntime.processing = true;
  voiceRuntime.lastAction = null;

  try {
    const action = detectLocalAction(message);
    const actionStartedAt = Date.now();
    const actionResult = action ? await runLocalAction(action) : null;
    if (actionResult) {
      voiceRuntime.processing = false;
      voiceRuntime.lastAction = actionResult;
      const tts = await generateOpenClawSpeech(actionResult.spoken);
      const response = {
        reply: actionResult.spoken,
        action: actionResult,
        tts,
        timings: {
          totalMs: Date.now() - startedAt,
          actionMs: Date.now() - actionStartedAt,
          agentMs: 0
        },
        voice: getVoiceState()
      };
      if (requestKey) recentVoiceRequests.set(requestKey, { at: Date.now(), reply: response.reply, action: response.action });
      return response;
    }

    const instantReply = detectInstantReply(message);
    if (instantReply && message.length < 90) {
      voiceRuntime.processing = false;
      const tts = await generateOpenClawSpeech(instantReply);
      const response = {
        reply: instantReply,
        action: null,
        tts,
        timings: {
          totalMs: Date.now() - startedAt,
          actionMs: 0,
          agentMs: 0
        },
        voice: getVoiceState()
      };
      if (requestKey) recentVoiceRequests.set(requestKey, { at: Date.now(), reply: response.reply, action: response.action });
      return response;
    }

    const agentStartedAt = Date.now();
    const commandParts = [
    "agent",
    "--session-key",
    YAMI_SESSION_KEY,
    "--message",
    message,
    "--json"
  ];
    if (YAMI_FAST_MODEL) commandParts.push("--model", YAMI_FAST_MODEL);
    commandParts.push(
    "--thinking",
    "off",
    "--timeout",
    String(YAMI_AGENT_TIMEOUT_SECONDS),
    "--verbose",
    "off"
  );
    const result = await runOpenClaw(commandParts, YAMI_AGENT_PROCESS_TIMEOUT_MS);
    voiceRuntime.processing = false;
    const agentMs = Date.now() - agentStartedAt;
    if (!result.ok) {
      voiceRuntime.lastError = (result.stderr || result.message || "Agente demorou.").trim();
      return {
        ok: false,
        reply: "Falha ao enviar para a Yami.",
        action: null,
        tts: null,
        slowFallback: false,
        error: voiceRuntime.lastError,
        timings: {
          totalMs: Date.now() - startedAt,
          actionMs: 0,
          agentMs
        },
        voice: getVoiceState()
      };
    }

    const reply = cleanYamiReply(extractYamiText(result.stdout), "Feito.");
    const tts = await generateOpenClawSpeech(reply);
    const response = {
      reply,
      action: null,
      tts,
      timings: {
        totalMs: Date.now() - startedAt,
        actionMs: 0,
        agentMs
      },
      voice: getVoiceState()
    };
    if (requestKey) recentVoiceRequests.set(requestKey, { at: Date.now(), reply: response.reply, action: response.action });
    return response;
  } catch (error) {
    voiceRuntime.processing = false;
    voiceRuntime.lastError = String(error && error.message || error);
    throw error;
  }
}

async function validateConfigOrRollback() {
  const result = await runOpenClaw(["config", "validate"], 45000);
  if (result.ok) return;
  try {
    if (fs.existsSync(CONFIG_BACKUP_PATH)) fs.copyFileSync(CONFIG_BACKUP_PATH, CONFIG_PATH);
  } catch {}
  throw new Error((result.stderr || result.stdout || result.message || "Yami config validation failed").trim());
}

async function restartGateway() {
  if (restartState.running) return restartState;
  restartState = {
    ...restartState,
    running: true,
    lastStartedAt: new Date().toISOString(),
    lastMessage: "Reiniciando gateway..."
  };
  const result = await runOpenClaw(["gateway", "restart"], 90000);
  restartState = {
    running: false,
    lastStartedAt: restartState.lastStartedAt,
    lastFinishedAt: new Date().toISOString(),
    lastOk: result.ok,
    lastMessage: (result.stdout || result.stderr || result.message || (result.ok ? "Gateway reiniciado." : "Falha ao reiniciar gateway.")).trim()
  };
  return restartState;
}

async function getChannelStatus() {
  const result = await runOpenClaw(["channels", "status", "--json"], 8000);
  if (!result.ok) return { ok: false, message: (result.stderr || result.message || "Status indisponivel").trim() };
  try {
    const parsed = JSON.parse(result.stdout);
    const channel = parsed.channels && parsed.channels.whatsapp ? parsed.channels.whatsapp : null;
    const account = parsed.channelAccounts && parsed.channelAccounts.whatsapp ? parsed.channelAccounts.whatsapp[0] : null;
    return {
      ok: true,
      whatsapp: channel ? {
        linked: Boolean(channel.linked),
        running: Boolean(channel.running),
        connected: Boolean(channel.connected),
        healthState: channel.healthState || null,
        lastError: channel.lastError || null,
        self: channel.self || null
      } : null,
      account: account ? {
        dmPolicy: account.dmPolicy || null,
        allowFrom: account.allowFrom || [],
        running: Boolean(account.running),
        connected: Boolean(account.connected),
        healthState: account.healthState || null
      } : null
    };
  } catch {
    return { ok: false, message: "Nao consegui ler o JSON de status." };
  }
}

function getConfigSummary() {
  const cfg = readConfig();
  const whatsapp = cfg.channels && cfg.channels.whatsapp ? cfg.channels.whatsapp : {};
  const account = whatsapp.accounts && whatsapp.accounts.default ? whatsapp.accounts.default : {};
  return {
    dmScope: cfg.session && cfg.session.dmScope ? cfg.session.dmScope : null,
    dmPolicy: account.dmPolicy || whatsapp.dmPolicy || null,
    groupPolicy: account.groupPolicy || whatsapp.groupPolicy || null,
    replyToMode: account.replyToMode || whatsapp.replyToMode || null,
    allowFrom: account.allowFrom || whatsapp.allowFrom || []
  };
}

function readProviders() {
  return readJsonFile(YAMI_AUTH_PROVIDERS_PATH, { providers: [], categories: [] });
}

function readAccounts() {
  return readJsonFile(YAMI_AUTH_ACCOUNTS_PATH, { accounts: [], updatedAt: null });
}

function saveAccounts(data) {
  writeJsonFile(YAMI_AUTH_ACCOUNTS_PATH, data);
}

function getConnectedAccounts() {
  const { accounts } = readAccounts();
  const { providers, categories } = readProviders();
  const connected = {};
  for (const account of accounts) {
    connected[account.provider] = account;
  }
  const enriched = providers
    .filter((p) => p.enabled)
    .map((provider) => {
      const account = connected[provider.id] || null;
      const category = categories.find((c) => c.id === provider.category);
      return {
        provider: provider.id,
        name: provider.name,
        icon: provider.icon,
        iconClass: provider.iconClass,
        category: category ? category.name : "Outros",
        categoryIcon: category ? category.icon : "🔌",
        color: provider.color,
        description: provider.description,
        capabilities: provider.capabilities || [],
        authType: provider.authType,
        connected: !!account,
        status: account ? account.status : "disconnected",
        email: account ? account.email : null,
        displayName: account ? account.displayName : null,
        scopes: account ? account.scopes : [],
        permissions: account ? account.permissions : [],
        lastSyncAt: account ? account.lastSyncAt : null,
        connectedAt: account ? account.connectedAt : null,
        error: account ? account.error : null
      };
    });
  return { accounts: enriched, categories, updatedAt: readAccounts().updatedAt };
}

function parseWhatsAppDirectSessionKey(key) {
  const perAccount = key.match(/^agent:([^:]+):whatsapp:([^:]+):direct:(.+)$/);
  if (perAccount) {
    return {
      agentId: perAccount[1],
      accountId: perAccount[2],
      peerId: perAccount[3]
    };
  }
  const perChannel = key.match(/^agent:([^:]+):whatsapp:direct:(.+)$/);
  if (perChannel) {
    return {
      agentId: perChannel[1],
      accountId: "default",
      peerId: perChannel[2]
    };
  }
  return null;
}

function getWhatsAppDirectChats() {
  const sessions = readJsonFile(SESSIONS_PATH, {});
  return Object.entries(sessions).map(([key, entry]) => {
    const parsed = parseWhatsAppDirectSessionKey(key);
    if (!parsed) return null;
    const peer = normalizeContact(parsed.peerId) || parsed.peerId;
    return {
      sessionKey: key,
      sessionId: entry && entry.sessionId ? entry.sessionId : null,
      number: peer,
      accountId: parsed.accountId,
      updatedAt: entry && typeof entry.updatedAt === "number" ? entry.updatedAt : null,
      displayName: entry && entry.displayName ? entry.displayName : peer,
      dashboardUrl: `http://127.0.0.1:18789/#session=${encodeURIComponent(key)}`
    };
  }).filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 128) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readYamiManifest() {
  return readJsonFile(YAMI_MANIFEST_PATH, {
    product: "Yami",
    runtime: "yami-native-runtime",
    version: "0.1.0-yami.1",
    architecture: {
      type: "own-runtime-with-upstream-adapters"
    },
    rules: {
      wakeWord: "acorda",
      restWord: "descansa",
      gatewayRestartOnlyWhenRequested: true
    }
  });
}

async function handleApi(req, res) {
  const routePath = req.url ? req.url.split("?")[0] : "";

  if (req.method === "GET" && routePath === "/api/version") {
    const manifest = readYamiManifest();
    return sendJson(res, 200, {
      ok: true,
      product: manifest.product || "Yami",
      runtime: manifest.runtime || "yami-native-runtime",
      version: YAMI_PANEL_VERSION,
      architecture: manifest.architecture || null,
      flow: "acorda -> yami -> nucleo yami -> yami audio -> descansa"
    });
  }

  if (req.method === "GET" && routePath === "/api/yami/manifest") {
    return sendJson(res, 200, {
      ok: true,
      manifest: readYamiManifest()
    });
  }

  if (req.method === "GET" && routePath === "/api/state") {
    const [status] = await Promise.all([getChannelStatus()]);
    return sendJson(res, 200, {
      state: readState(),
      manifest: readYamiManifest(),
      config: getConfigSummary(),
      status,
      chats: getWhatsAppDirectChats(),
      restart: restartState,
      voice: getVoiceState()
    });
  }

  if (req.method === "POST" && routePath === "/api/state") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const enabled = body.enabled !== false;
      const blockedContacts = unique((Array.isArray(body.blockedContacts) ? body.blockedContacts : []).map(normalizeContact));
      const state = saveState({ enabled, blockedContacts, voice: body.voice });
      applyConfig(enabled);
      await validateConfigOrRollback();
      return sendJson(res, 200, {
        ok: true,
        state,
        config: getConfigSummary(),
        chats: getWhatsAppDirectChats(),
        restart: restartState,
        voice: getVoiceState()
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "POST" && routePath === "/api/restart") {
    restartGateway().catch(() => {});
    return sendJson(res, 202, { ok: true, restart: restartState });
  }

  if (req.method === "POST" && routePath === "/api/yami/wake") {
    const body = JSON.parse(await readRequestBody(req) || "{}");
    const message = body.message || "";
    wakeVoiceRuntime(message);
    const tts = await generateOpenClawSpeech("Estou ouvindo.");
    return sendJson(res, 200, {
      ok: true,
      reply: "Estou ouvindo.",
      action: { id: "wake", label: "Acordar", ok: true },
      tts,
      voice: getVoiceState(),
      audioUrl: null
    });
  }

  if (req.method === "POST" && routePath === "/api/yami/ask") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const message = body.message || "";
      if (!voiceRuntime.awake && !isWakeIntent(message) && !isRestIntent(message)) {
        return sendJson(res, 200, {
          ok: true,
          reply: "Yami em espera. Diga acorda para iniciar.",
          action: null,
          timings: null,
          voice: getVoiceState(),
          tts: null,
          error: null,
          audioUrl: null
        });
      }
      const result = await askYami(message);
      return sendJson(res, result.ok === false ? 502 : 200, {
        ok: result.ok !== false,
        reply: result.reply,
        action: result.action || null,
        timings: result.timings || null,
        voice: result.voice || getVoiceState(),
        tts: result.tts || null,
        error: result.error || null,
        audioUrl: null
      });
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        message: String(error && error.message || error),
        reply: "Falha ao enviar para a Yami.",
        timings: null,
        voice: getVoiceState(),
        tts: null,
        audioUrl: null
      });
    }
  }

  if (req.method === "GET" && routePath === "/api/yami/voice/state") {
    return sendJson(res, 200, { ok: true, voice: getVoiceState() });
  }

  if (req.method === "POST" && routePath === "/api/yami/voice/stop") {
    const body = JSON.parse(await readRequestBody(req) || "{}");
    return sendJson(res, 200, {
      ok: true,
      voice: stopVoiceRuntime(body.reason || "descansa", true)
    });
  }

  if (req.method === "POST" && routePath === "/api/yami/speak") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const tts = await generateOpenClawSpeech(body.text, { allowWhileAsleep: true });
      return sendJson(res, 200, { ok: true, tts, voice: getVoiceState(), audioUrl: null });
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        message: String(error && error.message || error)
      });
    }
  }

  if (req.method === "POST" && routePath === "/api/yami/native-speak") {
    return sendJson(res, 410, {
      ok: false,
      active: false,
      disabled: true,
      message: "Speak WebRTC nativo desativado. Yami usa apenas uma voz local."
    });
  }

  if (req.method === "POST" && routePath === "/api/yami/native-speak-stop") {
    return sendJson(res, 200, {
      ok: true,
      active: false,
      disabled: true,
      message: "Speak WebRTC nativo ja esta desativado."
    });
  }

  if (req.method === "GET" && routePath === "/api/accounts") {
    return sendJson(res, 200, {
      ok: true,
      ...getConnectedAccounts()
    });
  }

  if (req.method === "GET" && routePath === "/api/accounts/providers") {
    const { providers, categories } = readProviders();
    return sendJson(res, 200, { ok: true, providers: providers.filter((p) => p.enabled), categories });
  }

  if (req.method === "POST" && routePath === "/api/accounts/connect") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const providerId = String(body.provider || "").trim();
      if (!providerId) return sendJson(res, 400, { ok: false, message: "Provider ID obrigatorio." });
      const { providers } = readProviders();
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return sendJson(res, 404, { ok: false, message: "Provider nao encontrado." });
      const { accounts } = readAccounts();
      const existing = accounts.findIndex((a) => a.provider === providerId);
      const now = new Date().toISOString();
      const accountEntry = {
        provider: providerId,
        status: "connected",
        email: body.email || null,
        displayName: body.displayName || provider.name,
        scopes: provider.scopes || [],
        permissions: (provider.capabilities || []).map((c) => ({
          id: c.id,
          name: c.name,
          granted: true,
          grantedAt: now
        })),
        connectedAt: now,
        lastSyncAt: now,
        error: null
      };
      if (existing >= 0) {
        accounts[existing] = { ...accounts[existing], ...accountEntry, connectedAt: accounts[existing].connectedAt };
      } else {
        accounts.push(accountEntry);
      }
      saveAccounts({ accounts, updatedAt: now });
      return sendJson(res, 200, { ok: true, account: accountEntry });
    } catch (error) {
      return sendJson(res, 400, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "POST" && routePath === "/api/accounts/disconnect") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const providerId = String(body.provider || "").trim();
      if (!providerId) return sendJson(res, 400, { ok: false, message: "Provider ID obrigatorio." });
      const { accounts } = readAccounts();
      const idx = accounts.findIndex((a) => a.provider === providerId);
      if (idx < 0) return sendJson(res, 404, { ok: false, message: "Conta nao encontrada." });
      accounts.splice(idx, 1);
      saveAccounts({ accounts, updatedAt: new Date().toISOString() });
      return sendJson(res, 200, { ok: true, message: `Conta ${providerId} desconectada.` });
    } catch (error) {
      return sendJson(res, 400, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "POST" && routePath === "/api/accounts/sync") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const providerId = String(body.provider || "").trim();
      if (!providerId) return sendJson(res, 400, { ok: false, message: "Provider ID obrigatorio." });
      const { accounts } = readAccounts();
      const account = accounts.find((a) => a.provider === providerId);
      if (!account) return sendJson(res, 404, { ok: false, message: "Conta nao encontrada." });
      account.lastSyncAt = new Date().toISOString();
      account.status = "connected";
      saveAccounts({ accounts, updatedAt: new Date().toISOString() });
      return sendJson(res, 200, { ok: true, message: "Sincronizado.", account });
    } catch (error) {
      return sendJson(res, 400, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "GET" && routePath === "/api/setup/permissions") {
    const cfg = readConfig();
    const setup = cfg.setup || {};
    return sendJson(res, 200, {
      ok: true,
      permissions: setup.permissions || {},
      setup: {
        critical: [
          { id: "camera-mic", icon: "📷", label: "Câmera e microfone", desc: "Para o Yami ouvir você e conversar", critical: true },
          { id: "files", icon: "📁", label: "Acesso a arquivos", desc: "Para o Yami ler e organizar seus arquivos", critical: true },
          { id: "notifications", icon: "🔔", label: "Notificações", desc: "Para o Yami te avisar quando precisar", critical: true }
        ],
        recommended: [
          { id: "browser", icon: "🌐", label: "Acesso ao navegador", desc: "Para o Yami pesquisar e preencher formulários", critical: false },
          { id: "mouse-keyboard", icon: "🖱", label: "Controle do mouse e teclado", desc: "Para o Yami automatizar tarefas", critical: false },
          { id: "auto-start", icon: "🚀", label: "Inicialização automática", desc: "Para o Yami ligar sozinho com seu PC", critical: false }
        ],
        optional: [
          { id: "accounts", icon: "🔗", label: "Integrações com contas", desc: "WhatsApp, Google, Spotify e outros", critical: false },
          { id: "calendar", icon: "📅", label: "Acesso à agenda", desc: "Para o Yami gerenciar compromissos", critical: false },
          { id: "mobile", icon: "📱", label: "App mobile", desc: "Para o Yami se comunicar com seu celular", critical: false },
          { id: "database", icon: "🗄", label: "Sincronização em nuvem", desc: "Para armazenar e sincronizar dados", critical: false },
          { id: "pendrive", icon: "💾", label: "Pendrive do Yami", desc: "Para salvar e transportar dados", critical: false }
        ]
      }
    });
  }

  if (req.method === "POST" && routePath === "/api/setup/permissions") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const cfg = readConfig();
      if (cfg.setup) {
        cfg.setup.permissions = body.permissions || {};
        cfg.setup.permissionsUpdatedAt = new Date().toISOString();
      }
      writeJsonFile(CONFIG_PATH, cfg);
      return sendJson(res, 200, { ok: true, message: "Permissões atualizadas." });
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "GET" && routePath === "/api/setup/status") {
    const cfg = readConfig();
    const setup = cfg.setup || {};
    const completed = setup.completed === true;
    return sendJson(res, 200, {
      ok: true,
      completed,
      setup: completed ? null : {
        critical: [
          { id: "camera-mic", icon: "📷", label: "Câmera e microfone", desc: "Para o Yami ouvir você e conversar", critical: true },
          { id: "files", icon: "📁", label: "Acesso a arquivos", desc: "Para o Yami ler e organizar seus arquivos", critical: true },
          { id: "notifications", icon: "🔔", label: "Notificações", desc: "Para o Yami te avisar quando precisar", critical: true }
        ],
        recommended: [
          { id: "browser", icon: "🌐", label: "Acesso ao navegador", desc: "Para o Yami pesquisar e preencher formulários", critical: false },
          { id: "mouse-keyboard", icon: "🖱", label: "Controle do mouse e teclado", desc: "Para o Yami automatizar tarefas", critical: false },
          { id: "auto-start", icon: "🚀", label: "Inicialização automática", desc: "Para o Yami ligar sozinho com seu PC", critical: false }
        ],
        optional: [
          { id: "accounts", icon: "🔗", label: "Integrações com contas", desc: "WhatsApp, Google, Spotify e outros", critical: false },
          { id: "calendar", icon: "📅", label: "Acesso à agenda", desc: "Para o Yami gerenciar compromissos", critical: false },
          { id: "mobile", icon: "📱", label: "App mobile", desc: "Para o Yami se comunicar com seu celular", critical: false },
          { id: "database", icon: "🗄", label: "Sincronização em nuvem", desc: "Para armazenar e sincronizar dados", critical: false },
          { id: "pendrive", icon: "💾", label: "Pendrive do Yami", desc: "Para salvar e transportar dados", critical: false }
        ]
      }
    });
  }

  if (req.method === "POST" && routePath === "/api/setup/complete") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const cfg = readConfig();
      
      // Criar estrutura de diretórios do Yami
      const dirsToCreate = [
        path.join(YAMI_RUNTIME_HOME, "comunicacao"),
        path.join(YAMI_RUNTIME_HOME, "agenda"),
        path.join(YAMI_RUNTIME_HOME, "arquivos"),
        path.join(YAMI_RUNTIME_HOME, "fotos"),
        path.join(YAMI_RUNTIME_HOME, "media"),
        path.join(YAMI_RUNTIME_HOME, "media", "outgoing"),
        path.join(YAMI_RUNTIME_HOME, "auto-panel", "tts"),
        path.join(YAMI_RUNTIME_HOME, "agents", "main", "sessions")
      ];
      
      for (const dir of dirsToCreate) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch {}
      }
      
      // Garantir que as integrações básicas estão configuradas
      cfg.channels = cfg.channels || {};
      cfg.channels.whatsapp = cfg.channels.whatsapp || {};
      cfg.plugins = cfg.plugins || {};
      cfg.plugins.entries = cfg.plugins.entries || {};
      cfg.plugins.allow = Array.isArray(cfg.plugins.allow) ? cfg.plugins.allow : [];
      
      // Marcar setup como concluído
      cfg.setup = {
        completed: true,
        completedAt: new Date().toISOString(),
        version: YAMI_PANEL_VERSION,
        permissions: body.permissions || {}
      };
      
      writeJsonFile(CONFIG_PATH, cfg);
      return sendJson(res, 200, { 
        ok: true, 
        message: "Configuração inicial concluída.",
        setup: cfg.setup
      });
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (req.method === "POST" && routePath === "/api/accounts/revoke") {
    try {
      const body = JSON.parse(await readRequestBody(req) || "{}");
      const providerId = String(body.provider || "").trim();
      if (!providerId) return sendJson(res, 400, { ok: false, message: "Provider ID obrigatorio." });
      const { accounts } = readAccounts();
      const account = accounts.find((a) => a.provider === providerId);
      if (account) {
        account.status = "revoked";
        account.permissions = (account.permissions || []).map((p) => ({ ...p, granted: false }));
      }
      saveAccounts({ accounts, updatedAt: new Date().toISOString() });
      return sendJson(res, 200, { ok: true, message: "Permissoes revogadas." });
    } catch (error) {
      return sendJson(res, 400, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (routePath === "/api/pendrive/init") {
    if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "POST required" });
    try {
      const result = PENDRIVE.initPendrive();
      return sendJson(res, 200, result);
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
    }
  }

  if (routePath === "/api/pendrive") {
    if (req.method === "GET") {
      return sendJson(res, 200, PENDRIVE.getFullStatus());
    }
    return sendJson(res, 405, { ok: false, message: "GET required" });
  }

  if (routePath === "/api/pendrive/identity") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, identity: PENDRIVE.getIdentity() });
    }
    return sendJson(res, 405, { ok: false, message: "GET required" });
  }

  if (routePath === "/api/pendrive/profile") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, profile: PENDRIVE.getProfile() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const profile = PENDRIVE.saveProfile(body);
        return sendJson(res, 200, { ok: true, profile });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/appearance") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, appearance: PENDRIVE.getAppearance() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const { key, value, ...rest } = body;
        let appearance;
        if (key && value !== undefined) {
          appearance = PENDRIVE.setAppearance(key, value);
        } else {
          appearance = PENDRIVE.saveAppearance(rest);
        }
        return sendJson(res, 200, { ok: true, appearance });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/evolution") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, evolution: PENDRIVE.getEvolution() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const result = PENDRIVE.registerEvolution(body);
        return sendJson(res, 200, { ok: true, evolution: result });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/voice") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, voice: PENDRIVE.getVoiceSettings() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const voice = PENDRIVE.saveVoiceSettings(body);
        return sendJson(res, 200, { ok: true, voice });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/sync") {
    if (req.method === "POST") {
      PENDRIVE.recordSync();
      return sendJson(res, 200, { ok: true, sync: PENDRIVE.getSync() });
    }
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, sync: PENDRIVE.getSync() });
    }
  }

  if (routePath === "/api/pendrive/social/friends") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, friends: PENDRIVE.getSocialFriends() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const { action, yamiId, name, message } = body;
        let result;
        switch (action) {
          case "add":
            result = PENDRIVE.addFriend(yamiId, name);
            break;
          case "remove":
            result = PENDRIVE.removeFriend(yamiId);
            break;
          case "invite":
            result = PENDRIVE.sendFriendRequest(yamiId, message);
            break;
          case "accept":
            result = PENDRIVE.acceptFriendRequest(yamiId);
            break;
          default:
            return sendJson(res, 400, { ok: false, message: "Acao invalida. Use: add, remove, invite, accept" });
        }
        return sendJson(res, 200, result);
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/social/card") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, card: PENDRIVE.getProfileCard() });
    }
    if (req.method === "POST") {
      try {
        const card = PENDRIVE.generateProfileCard();
        return sendJson(res, 200, { ok: true, card });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/social/messages") {
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const withYamiId = url.searchParams.get("with") || "";
      if (withYamiId) {
        return sendJson(res, 200, { ok: true, messages: PENDRIVE.getMessages(withYamiId) });
      }
      const msgsData = readJsonFile(PENDRIVE.getPendrivePaths().socialMessages, { conversations: [] });
      return sendJson(res, 200, {
        ok: true,
        conversations: (msgsData.conversations || []).map((c) => ({
          withYamiId: c.withYamiId,
          displayName: c.displayName,
          messageCount: (c.messages || []).length
        }))
      });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const { action, toYamiId, text, fromYamiId } = body;
        let result;
        switch (action) {
          case "send":
            result = PENDRIVE.sendMessage(toYamiId, text);
            break;
          case "receive":
            result = PENDRIVE.receiveMessage(fromYamiId, text);
            break;
          case "markRead":
            result = PENDRIVE.markMessagesRead(toYamiId);
            break;
          default:
            return sendJson(res, 400, { ok: false, message: "Acao invalida. Use: send, receive, markRead" });
        }
        return sendJson(res, 200, { ok: true, message: result });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/memory") {
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const query = url.searchParams.get("search") || "";
      if (query) {
        return sendJson(res, 200, { ok: true, results: PENDRIVE.searchMemory(query) });
      }
      return sendJson(res, 200, { ok: true, memory: PENDRIVE.getMemoryEntries() });
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readRequestBody(req) || "{}");
        const entry = PENDRIVE.addMemoryEntry(body.type || "note", body.content, body.tags);
        return sendJson(res, 200, { ok: true, entry });
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  if (routePath === "/api/pendrive/export") {
    if (req.method === "GET") {
      try {
        return sendJson(res, 200, PENDRIVE.getExportBundle());
      } catch (error) {
        return sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
      }
    }
  }

  sendJson(res, 404, { ok: false, message: "API route not found" });
}

try {
  if (!PENDRIVE.getIdentity()) {
    PENDRIVE.initPendrive();
    console.log("[pendrive] Pendrive YAMI inicializado automaticamente.");
  }
} catch {}

const server = http.createServer(async (req, res) => {
  try {
    const routePath = req.url ? req.url.split("?")[0] : "";
    if (req.method === "GET" && routePath.startsWith("/api/yami/audio/")) {
      const fileName = path.basename(decodeURIComponent(routePath.slice("/api/yami/audio/".length)));
      const audioPath = path.join(TTS_DIR, fileName);
      if (!/\.(mp3|wav)$/i.test(fileName) || !audioPath.startsWith(TTS_DIR) || !fs.existsSync(audioPath)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Audio not found");
      }
      const audio = fs.readFileSync(audioPath);
      const contentType = fileName.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "Content-Length": audio.length
      });
      return res.end(audio);
    }
    if (routePath.startsWith("/api/")) return await handleApi(req, res);
    if (req.method === "GET" && (routePath === "/" || routePath === "/index.html")) {
      const html = fs.readFileSync(INDEX_PATH);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Length": html.length
      });
      return res.end(html);
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    sendJson(res, 500, { ok: false, message: String(error && error.message || error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Yami Control Panel listening on http://${HOST}:${PORT}`);
});
