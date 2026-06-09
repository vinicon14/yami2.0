/* ─── YAMI Desktop App — Main UI Logic ────────────────────────────────────── */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const STATE = {
  page: 'chat',
  config: null,
  yamiConfig: null,
  gatewayUrl: null,
  gatewayToken: null,
  ws: null,
  wsReady: false,
  wsRetries: 0,
  ttsEnabled: false,
  voiceActive: false,
  tamaEmoji: '🤖',
  userName: 'você',
  assistantName: 'YAMI',
  energy: 85,
  happiness: 90,
  learning: 72,
  sessionId: 'default',
  calDate: new Date(),
  calSelectedDay: new Date(),
  editingEventId: null,
  msgCount: 0,
  gatewayOnline: false
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  STATE.page = page;

  if (page === 'agenda') renderCalendar();
  if (page === 'settings') loadSettings();
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ─── Onboarding ───────────────────────────────────────────────────────────────
let obStep = 1;
const OB_STEPS = 4;

function updateObUI() {
  for (let i = 1; i <= OB_STEPS; i++) {
    document.getElementById(`ob-step-${i}`).classList.toggle('active', i === obStep);
    document.getElementById(`od-${i}`)?.classList.toggle('active', i === obStep);
  }
  const backBtn = document.getElementById('ob-back');
  const nextBtn = document.getElementById('ob-next');
  backBtn.style.visibility = obStep > 1 ? 'visible' : 'hidden';
  nextBtn.textContent = obStep === OB_STEPS ? '✨ Entrar' : 'Próximo →';
}

document.getElementById('ob-next').addEventListener('click', async () => {
  if (obStep < OB_STEPS) {
    obStep++;
    updateObUI();
  } else {
    await finishOnboarding();
  }
});

document.getElementById('ob-back').addEventListener('click', () => {
  if (obStep > 1) { obStep--; updateObUI(); }
});

// Tamagoshi selection in onboarding
document.querySelectorAll('#ob-step-2 .tama-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#ob-step-2 .tama-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    STATE.tamaEmoji = opt.dataset.emoji;
    const names = { '🤖':'Robô','😊':'Feliz','👾':'Retro','🐱':'Gato','🦄':'Unicórnio','🌟':'Estrela' };
    document.getElementById('ob-tama-selected').textContent = `Selecionado: ${STATE.tamaEmoji} ${names[STATE.tamaEmoji] || ''}`;
  });
});

async function finishOnboarding() {
  const username = document.getElementById('ob-username').value.trim() || 'você';
  const voice = document.getElementById('ob-voice').value;
  STATE.userName = username;

  const cfg = {
    initialized: true,
    tamaEmoji: STATE.tamaEmoji,
    userName: username,
    assistantName: 'YAMI',
    voiceProvider: voice,
    ttsEnabled: false,
    voiceListenEnabled: false,
    notifications: true,
    version: '0.1.0',
    createdAt: new Date().toISOString()
  };
  await window.yami.saveConfig(cfg);
  await window.yami.settings.set('onboarding_done', true);

  document.getElementById('onboarding').classList.add('hidden');
  applyConfig(cfg);
  toast(`Bem-vindo, ${username}! 🎉`, 'success');
}

// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
  STATE.config = await window.yami.getConfig();
  STATE.yamiConfig = await window.yami.getYamiConfig();
  STATE.gatewayUrl = await window.yami.gateway.url();
  STATE.gatewayToken = await window.yami.gateway.token();

  if (!STATE.config || !STATE.config.initialized) {
    document.getElementById('onboarding').classList.remove('hidden');
  } else {
    document.getElementById('onboarding').classList.add('hidden');
    applyConfig(STATE.config);
  }
}

function applyConfig(cfg) {
  STATE.tamaEmoji = cfg.tamaEmoji || '🤖';
  STATE.userName = cfg.userName || 'você';
  STATE.assistantName = cfg.assistantName || 'YAMI';
  STATE.ttsEnabled = cfg.ttsEnabled || false;
  updateTamaEmoji(STATE.tamaEmoji);
  syncTamaSelectors(STATE.tamaEmoji);
}

// ─── Tamagoshi ────────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: '😊', label: 'Bem-humorado', state: 'Pronto para ajudar' },
  { emoji: '🤔', label: 'Pensando...', state: 'Processando informações' },
  { emoji: '🤩', label: 'Animado!', state: 'Acabou de aprender algo novo' },
  { emoji: '😴', label: 'Sonolento', state: 'Modo de espera' },
  { emoji: '🧠', label: 'Focado', state: 'Analisando dados' },
  { emoji: '⚡', label: 'Energizado', state: 'Alta atividade' }
];

function updateTamaEmoji(emoji) {
  document.getElementById('tama-emoji').textContent = emoji;
  document.getElementById('sidebar-tama').textContent = emoji;
}

function setTamaMood(moodKey) {
  const map = { idle: 0, thinking: 1, excited: 2, sleeping: 3, focused: 4, active: 5 };
  const mood = MOODS[map[moodKey] ?? 0];
  document.getElementById('tama-state').textContent = mood.state;
  document.getElementById('tama-mood').textContent = `${mood.emoji} ${mood.label}`;
}

function updateStats(energy, happiness, learning) {
  STATE.energy = Math.max(0, Math.min(100, energy));
  STATE.happiness = Math.max(0, Math.min(100, happiness));
  STATE.learning = Math.max(0, Math.min(100, learning));
  ['energy', 'happy', 'learn'].forEach((key, i) => {
    const val = [STATE.energy, STATE.happiness, STATE.learning][i];
    const barId = `stat-${key}`;
    const valId = `stat-${key}-val`;
    document.getElementById(barId).style.width = `${val}%`;
    document.getElementById(valId).textContent = `${val}%`;
  });
}

function syncTamaSelectors(emoji) {
  document.querySelectorAll('.tama-opt').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.emoji === emoji);
  });
}

// Settings tamagoshi selector
document.querySelectorAll('#tama-selector-settings .tama-opt').forEach(opt => {
  opt.addEventListener('click', async () => {
    STATE.tamaEmoji = opt.dataset.emoji;
    syncTamaSelectors(opt.dataset.emoji);
    updateTamaEmoji(opt.dataset.emoji);
    await saveSettings();
    toast(`Avatar atualizado: ${opt.dataset.emoji}`, 'success');
  });
});

// ─── Gateway WebSocket ────────────────────────────────────────────────────────
function connectWS() {
  if (!STATE.gatewayUrl) return;
  const wsUrl = STATE.gatewayUrl.replace('http://', 'ws://').replace('https://', 'wss://');

  try {
    STATE.ws = new WebSocket(wsUrl);
  } catch (e) {
    console.warn('WS connect failed:', e.message);
    scheduleWSRetry();
    return;
  }

  STATE.ws.addEventListener('open', () => {
    STATE.wsReady = true;
    STATE.wsRetries = 0;
    updateGatewayStatus(true);
    console.log('Gateway WS connected');
    // Authenticate if token available
    if (STATE.gatewayToken) {
      STATE.ws.send(JSON.stringify({ type: 'auth', token: STATE.gatewayToken }));
    }
  });

  STATE.ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      handleGatewayMessage(msg);
    } catch {}
  });

  STATE.ws.addEventListener('close', () => {
    STATE.wsReady = false;
    updateGatewayStatus(false);
    scheduleWSRetry();
  });

  STATE.ws.addEventListener('error', () => {
    STATE.wsReady = false;
    updateGatewayStatus(false);
  });
}

function scheduleWSRetry() {
  STATE.wsRetries++;
  const delay = Math.min(30000, 2000 * STATE.wsRetries);
  setTimeout(connectWS, delay);
}

function handleGatewayMessage(msg) {
  if (msg.type === 'message' || msg.type === 'chat') {
    const content = msg.content || msg.text || msg.body || '';
    if (content) {
      addMessage(content, 'ai');
      setTamaMood('idle');
      if (STATE.ttsEnabled) window.yami.tts.speak(content);
      updateStats(
        Math.min(100, STATE.energy + 2),
        Math.min(100, STATE.happiness + 1),
        Math.min(100, STATE.learning + 3)
      );
    }
  } else if (msg.type === 'thinking' || msg.type === 'processing') {
    showTyping(true);
    setTamaMood('thinking');
  } else if (msg.type === 'done') {
    showTyping(false);
  } else if (msg.type === 'error') {
    showTyping(false);
    setTamaMood('idle');
    toast(`Erro: ${msg.message || 'Erro desconhecido'}`, 'error');
  }
}

function updateGatewayStatus(online) {
  STATE.gatewayOnline = online;
  const el = document.getElementById('gateway-status');
  const txt = document.getElementById('gateway-status-text');
  if (online) {
    el.className = 'sidebar-status';
    txt.textContent = 'Gateway Online';
  } else {
    el.className = 'sidebar-status offline';
    txt.textContent = 'Offline';
  }
}

// ─── Send message via Gateway HTTP ───────────────────────────────────────────
async function sendToGateway(text) {
  // First try WebSocket
  if (STATE.wsReady && STATE.ws) {
    STATE.ws.send(JSON.stringify({
      type: 'chat',
      content: text,
      session: STATE.sessionId
    }));
    return true;
  }

  // Fallback to HTTP
  try {
    const res = await window.yami.gateway.request('POST', '/api/chat', {
      content: text,
      session: STATE.sessionId,
      stream: false
    });
    if (res.status === 200 && res.body) {
      const reply = res.body.content || res.body.text || res.body.response || '';
      if (reply) {
        addMessage(reply, 'ai');
        if (STATE.ttsEnabled) window.yami.tts.speak(reply);
        return true;
      }
    }
  } catch (e) {
    console.warn('HTTP fallback failed:', e);
  }
  return false;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  await window.yami.messages.add({ session_id: STATE.sessionId, role: 'user', content: text });
  addMessage(text, 'user');
  setTamaMood('thinking');
  showTyping(true);
  STATE.msgCount++;
  updateStats(Math.max(10, STATE.energy - 1), STATE.happiness, Math.min(100, STATE.learning + 1));

  const sent = await sendToGateway(text);

  if (!sent) {
    showTyping(false);
    setTamaMood('idle');
    // Offline mode – simple acknowledgement
    const reply = `Recebido! Gateway offline agora. Mensagem: "${text.substring(0, 60)}..."`;
    addMessage(reply, 'ai');
    await window.yami.messages.add({ session_id: STATE.sessionId, role: 'assistant', content: reply });
  }

  // Decrease typing indicator after timeout
  setTimeout(() => showTyping(false), 30000);
}

function addMessage(text, role) {
  showTyping(false);
  const container = document.getElementById('messages');
  const avatars = { user: '👤', ai: '🤖', system: 'ℹ️' };

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (role === 'system') {
    row.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  } else {
    row.innerHTML = `
      <div class="msg-avatar">${role === 'ai' ? STATE.tamaEmoji : avatars.user}</div>
      <div>
        <div class="msg-bubble">${formatMessageText(text)}</div>
        <div class="msg-time">${time}</div>
      </div>`;
  }
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;

  if (role === 'ai') {
    window.yami.messages.add({ session_id: STATE.sessionId, role: 'assistant', content: text }).catch(() => {});
  }
}

function showTyping(show) {
  const existing = document.getElementById('typing-row');
  if (show && !existing) {
    const container = document.getElementById('messages');
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'msg-row ai';
    row.innerHTML = `
      <div class="msg-avatar">${STATE.tamaEmoji}</div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  } else if (!show && existing) {
    existing.remove();
  }
}

function formatMessageText(text) {
  // Basic markdown: bold, code, line breaks
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.3);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px;">$1</code>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function loadChatHistory() {
  const history = await window.yami.messages.get(STATE.sessionId, 30);
  if (!history || !history.length) return;
  const container = document.getElementById('messages');
  container.innerHTML = '';
  history.forEach(msg => addMessage(msg.content, msg.role === 'assistant' ? 'ai' : msg.role));
}

// Chat event listeners
document.getElementById('btn-send').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
document.getElementById('chat-input').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(120, this.scrollHeight) + 'px';
});

document.getElementById('btn-clear-chat').addEventListener('click', async () => {
  if (!confirm('Limpar histórico de chat?')) return;
  await window.yami.messages.clear(STATE.sessionId);
  document.getElementById('messages').innerHTML = `<div class="msg-row system"><div class="msg-bubble">Histórico limpo. Como posso ajudar?</div></div>`;
  toast('Chat limpo', 'info');
});

document.getElementById('btn-tts-toggle').addEventListener('click', () => {
  STATE.ttsEnabled = !STATE.ttsEnabled;
  document.getElementById('btn-tts-toggle').textContent = STATE.ttsEnabled ? '🔊' : '🔇';
  toast(STATE.ttsEnabled ? 'Voz ativada' : 'Voz desativada', 'info');
});

// ─── Calendar / Agenda ────────────────────────────────────────────────────────
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderCalendar() {
  const d = STATE.calDate;
  document.getElementById('cal-month-label').textContent = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const today = new Date();

  const grid = document.getElementById('cal-days');
  grid.innerHTML = '';

  // Load events for this month
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
  window.yami.events.get({ start, end }).then(events => {
    const evtsByDay = {};
    events.forEach(e => {
      const day = new Date(e.start_time).getDate();
      if (!evtsByDay[day]) evtsByDay[day] = [];
      evtsByDay[day].push(e);
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day other-month';
      grid.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      const isToday = today.getDate() === day && today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear();
      if (isToday) cell.classList.add('today');
      const selDay = STATE.calSelectedDay;
      if (selDay.getDate() === day && selDay.getMonth() === d.getMonth() && selDay.getFullYear() === d.getFullYear()) {
        cell.classList.add('selected');
      }

      const dayNum = document.createElement('span');
      dayNum.textContent = day;
      cell.appendChild(dayNum);

      if (evtsByDay[day]) {
        const dots = document.createElement('div');
        dots.className = 'day-events';
        evtsByDay[day].slice(0, 3).forEach(e => {
          const dot = document.createElement('div');
          dot.className = 'evt-dot';
          dot.style.background = e.color || '#3b82f6';
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
      }

      cell.addEventListener('click', () => {
        STATE.calSelectedDay = new Date(d.getFullYear(), d.getMonth(), day);
        renderCalendar();
        loadDayEvents(STATE.calSelectedDay);
      });

      grid.appendChild(cell);
    }
  });

  loadDayEvents(STATE.calSelectedDay);
}

async function loadDayEvents(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = start + 86400000 - 1;
  const events = await window.yami.events.get({ start, end });

  const titleEl = document.getElementById('events-col-title');
  const countEl = document.getElementById('events-col-count');
  const listEl = document.getElementById('events-list');

  const isToday = new Date().toDateString() === date.toDateString();
  titleEl.textContent = isToday ? 'Eventos de hoje' : `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
  countEl.textContent = events.length;

  if (!events.length) {
    listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:13px;">Nenhum evento</div>';
    return;
  }

  listEl.innerHTML = events.map(e => {
    const t = new Date(e.start_time);
    const timeStr = e.all_day ? 'Dia inteiro' : t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `<div class="event-card" style="border-left-color:${e.color||'#3b82f6'}" data-id="${e.id}">
      <div class="event-title">${escapeHtml(e.title)}</div>
      <div class="event-time">${timeStr}</div>
      ${e.description ? `<div class="event-desc">${escapeHtml(e.description)}</div>` : ''}
    </div>`;
  }).join('');

  listEl.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => openEditEventModal(parseInt(card.dataset.id)));
  });
}

document.getElementById('cal-prev').addEventListener('click', () => {
  STATE.calDate = new Date(STATE.calDate.getFullYear(), STATE.calDate.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  STATE.calDate = new Date(STATE.calDate.getFullYear(), STATE.calDate.getMonth() + 1, 1);
  renderCalendar();
});

// ─── Event Modal ──────────────────────────────────────────────────────────────
function openNewEventModal() {
  STATE.editingEventId = null;
  document.getElementById('event-modal-title').textContent = 'Novo Evento';
  document.getElementById('evt-title').value = '';
  document.getElementById('evt-desc').value = '';
  document.getElementById('evt-delete').classList.add('hidden');

  const now = new Date(STATE.calSelectedDay);
  now.setHours(new Date().getHours(), 0, 0, 0);
  const end = new Date(now.getTime() + 3600000);
  document.getElementById('evt-start').value = toDateTimeLocal(now);
  document.getElementById('evt-end').value = toDateTimeLocal(end);

  document.getElementById('event-modal').classList.remove('hidden');
  document.getElementById('evt-title').focus();
}

async function openEditEventModal(id) {
  const events = await window.yami.events.get();
  const evt = events.find(e => e.id === id);
  if (!evt) return;

  STATE.editingEventId = id;
  document.getElementById('event-modal-title').textContent = 'Editar Evento';
  document.getElementById('evt-title').value = evt.title;
  document.getElementById('evt-desc').value = evt.description || '';
  document.getElementById('evt-start').value = toDateTimeLocal(new Date(evt.start_time));
  document.getElementById('evt-end').value = evt.end_time ? toDateTimeLocal(new Date(evt.end_time)) : '';
  document.getElementById('evt-color').value = evt.color || '#3b82f6';
  document.getElementById('evt-reminder').value = evt.reminder_minutes ?? 15;
  document.getElementById('evt-delete').classList.remove('hidden');

  document.getElementById('event-modal').classList.remove('hidden');
}

function toDateTimeLocal(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById('btn-new-event').addEventListener('click', openNewEventModal);
document.getElementById('evt-cancel').addEventListener('click', () => document.getElementById('event-modal').classList.add('hidden'));

document.getElementById('evt-save').addEventListener('click', async () => {
  const title = document.getElementById('evt-title').value.trim();
  if (!title) { toast('Informe um título', 'error'); return; }

  const startStr = document.getElementById('evt-start').value;
  if (!startStr) { toast('Informe a data/hora de início', 'error'); return; }

  const eventData = {
    title,
    description: document.getElementById('evt-desc').value.trim(),
    start_time: new Date(startStr).getTime(),
    end_time: document.getElementById('evt-end').value ? new Date(document.getElementById('evt-end').value).getTime() : null,
    color: document.getElementById('evt-color').value,
    reminder_minutes: parseInt(document.getElementById('evt-reminder').value),
    all_day: false
  };

  if (STATE.editingEventId) {
    await window.yami.events.update({ id: STATE.editingEventId, ...eventData });
    toast('Evento atualizado!', 'success');
  } else {
    await window.yami.events.add(eventData);
    toast('Evento criado!', 'success');
  }

  document.getElementById('event-modal').classList.add('hidden');
  renderCalendar();
});

document.getElementById('evt-delete').addEventListener('click', async () => {
  if (!STATE.editingEventId) return;
  if (!confirm('Excluir este evento?')) return;
  await window.yami.events.delete(STATE.editingEventId);
  document.getElementById('event-modal').classList.add('hidden');
  toast('Evento excluído', 'info');
  renderCalendar();
});

// Close modal on overlay click
document.getElementById('event-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('event-modal')) {
    document.getElementById('event-modal').classList.add('hidden');
  }
});

// ─── Integrations ─────────────────────────────────────────────────────────────
async function checkIntegrations() {
  // Check Gateway status
  const gw = await window.yami.gateway.status();
  updateGatewayStatus(gw.running);

  // WhatsApp – check from yami config
  const yamiCfg = STATE.yamiConfig;
  if (yamiCfg?.channels?.whatsapp?.enabled) {
    document.getElementById('badge-whatsapp').className = 'integ-badge connected';
    document.getElementById('badge-whatsapp').textContent = 'Conectado';
    document.getElementById('integ-whatsapp').classList.add('connected');
    const num = yamiCfg.channels.whatsapp.allowFrom?.[0] || '';
    document.getElementById('detail-whatsapp').textContent = `Conta: Yami · ${num}`;
  }

  // OpenAI
  const openaiProfile = yamiCfg?.auth?.profiles?.['openai:vinimarques12122020@gmail.com'];
  if (openaiProfile) {
    document.getElementById('badge-openai').className = 'integ-badge connected';
    document.getElementById('badge-openai').textContent = 'Conectado';
    document.getElementById('integ-openai').classList.add('connected');
    document.getElementById('detail-openai').textContent = `${openaiProfile.email} · ${yamiCfg?.agents?.defaults?.model?.primary || 'gpt-5.5'}`;
  }

  // Browser/CDP
  try {
    const cdpRes = await window.yami.gateway.request('GET', '/api/browser/status', null);
    if (cdpRes.status === 200) {
      document.getElementById('badge-browser').className = 'integ-badge connected';
      document.getElementById('badge-browser').textContent = 'Conectado';
      document.getElementById('integ-browser').classList.add('connected');
    }
  } catch {}
}

document.getElementById('btn-refresh-integrations').addEventListener('click', async () => {
  toast('Atualizando integrações...', 'info', 1500);
  await checkIntegrations();
});

document.getElementById('btn-wa-test').addEventListener('click', async () => {
  toast('Enviando mensagem de teste via WhatsApp...', 'info');
  const res = await window.yami.gateway.request('POST', '/api/channels/whatsapp/send', {
    to: 'self',
    text: '🤖 Teste do YAMI Desktop!'
  });
  if (res.status === 200) toast('Mensagem enviada!', 'success');
  else toast('Erro ao enviar', 'error');
});

document.getElementById('btn-ai-test').addEventListener('click', async () => {
  navigate('chat');
  setTimeout(() => {
    document.getElementById('chat-input').value = 'Oi YAMI! Faça um teste rápido.';
    sendMessage();
  }, 300);
});

document.getElementById('btn-browser-connect').addEventListener('click', () => {
  toast('Abra o Chrome com --remote-debugging-port=9222', 'info', 4000);
});

document.getElementById('btn-discord-setup').addEventListener('click', () => {
  toast('Configure o Discord bot token em Configurações → Gateway', 'info', 4000);
});

document.getElementById('btn-voice-start-integ').addEventListener('click', async () => {
  await window.yami.voice.start();
  STATE.voiceActive = true;
  document.getElementById('badge-voice').className = 'integ-badge connected';
  document.getElementById('badge-voice').textContent = 'Ativo';
  document.getElementById('integ-voice').classList.add('connected');
  toast('Reconhecimento de voz ativado', 'success');
});

document.getElementById('btn-tts-test').addEventListener('click', () => {
  window.yami.tts.speak(`Olá ${STATE.userName}! Eu sou o YAMI, seu assistente de inteligência artificial.`);
  toast('Testando TTS...', 'info');
});

document.getElementById('btn-gcal-connect').addEventListener('click', () => {
  toast('Google Calendar: configure OAuth no Gateway para sincronizar', 'info', 4000);
});

// ─── Settings ─────────────────────────────────────────────────────────────────
async function loadSettings() {
  const cfg = STATE.config;
  if (!cfg) return;

  document.getElementById('set-username').value = cfg.userName || '';
  document.getElementById('set-assistant-name').value = cfg.assistantName || 'YAMI';
  document.getElementById('set-tts-auto').checked = cfg.ttsEnabled || false;
  document.getElementById('set-voice-provider').value = cfg.voiceProvider || 'windows';
  document.getElementById('set-voice-listen').checked = cfg.voiceListenEnabled || false;
  document.getElementById('set-notifications').checked = cfg.notifications !== false;

  syncTamaSelectors(STATE.tamaEmoji);

  // System info
  const info = await window.yami.system();
  document.getElementById('info-yami-home').textContent = info.yamiHome;
  document.getElementById('info-db-path').textContent = info.dbPath;

  // Gateway status
  const gw = await window.yami.gateway.status();
  const gwText = document.getElementById('gw-status-text');
  gwText.textContent = gw.running ? `Online (porta ${gw.port})` : 'Offline';
  gwText.style.color = gw.running ? 'var(--green)' : 'var(--red)';

  const yamiCfg = STATE.yamiConfig;
  if (yamiCfg?.agents?.defaults?.model?.primary) {
    document.getElementById('gw-model-text').textContent = yamiCfg.agents.defaults.model.primary;
  }
}

async function saveSettings() {
  const cfg = {
    ...STATE.config,
    tamaEmoji: STATE.tamaEmoji,
    userName: document.getElementById('set-username')?.value.trim() || STATE.userName,
    assistantName: document.getElementById('set-assistant-name')?.value.trim() || 'YAMI',
    ttsEnabled: document.getElementById('set-tts-auto')?.checked ?? false,
    voiceProvider: document.getElementById('set-voice-provider')?.value || 'windows',
    voiceListenEnabled: document.getElementById('set-voice-listen')?.checked ?? false,
    notifications: document.getElementById('set-notifications')?.checked !== false
  };
  STATE.config = cfg;
  STATE.userName = cfg.userName;
  STATE.assistantName = cfg.assistantName;
  STATE.ttsEnabled = cfg.ttsEnabled;
  await window.yami.saveConfig(cfg);
}

// Settings listeners
document.getElementById('btn-check-gw').addEventListener('click', async () => {
  const gw = await window.yami.gateway.status();
  const gwText = document.getElementById('gw-status-text');
  gwText.textContent = gw.running ? `Online (porta ${gw.port})` : 'Offline';
  gwText.style.color = gw.running ? 'var(--green)' : 'var(--red)';
  updateGatewayStatus(gw.running);
  toast(gw.running ? 'Gateway online!' : 'Gateway offline', gw.running ? 'success' : 'error');
});

document.getElementById('btn-open-dash').addEventListener('click', () => window.yami.gateway.openDashboard());
document.getElementById('btn-open-dashboard').addEventListener('click', () => window.yami.gateway.openDashboard());

document.getElementById('btn-test-tts-settings').addEventListener('click', () => {
  const name = document.getElementById('set-username')?.value || STATE.userName;
  window.yami.tts.speak(`Olá ${name}! Tudo funcionando perfeitamente.`);
});

document.getElementById('set-tts-auto').addEventListener('change', saveSettings);
document.getElementById('set-voice-listen').addEventListener('change', async (e) => {
  if (e.target.checked) {
    await window.yami.voice.start();
    STATE.voiceActive = true;
    toast('Reconhecimento de voz ativado', 'success');
  } else {
    await window.yami.voice.stop();
    STATE.voiceActive = false;
    toast('Reconhecimento de voz desativado', 'info');
  }
  await saveSettings();
});
document.getElementById('set-notifications').addEventListener('change', saveSettings);
document.getElementById('set-voice-provider').addEventListener('change', saveSettings);
document.getElementById('set-username').addEventListener('change', saveSettings);
document.getElementById('set-assistant-name').addEventListener('change', saveSettings);

// ─── Voice commands ───────────────────────────────────────────────────────────
window.yami.voice.onCommand(cmd => {
  if (cmd.includes('acorda') || cmd.includes('ativa')) {
    if (STATE.ttsEnabled) window.yami.tts.speak('Estou aqui!');
    toast('Voz: "acorda" detectado', 'info');
    setTamaMood('active');
  } else if (cmd.includes('descansa') || cmd.includes('dorme')) {
    if (STATE.ttsEnabled) window.yami.tts.speak('Descansando...');
    toast('Voz: "descansa" detectado', 'info');
    setTamaMood('sleeping');
  }
});

// Sidebar voice toggle
document.getElementById('btn-voice-toggle').addEventListener('click', async () => {
  if (STATE.voiceActive) {
    await window.yami.voice.stop();
    STATE.voiceActive = false;
    document.querySelector('#btn-voice-toggle .nav-label').textContent = 'Voz';
    toast('Voz desativada', 'info');
  } else {
    await window.yami.voice.start();
    STATE.voiceActive = true;
    document.querySelector('#btn-voice-toggle .nav-label').textContent = 'Voz ●';
    toast('Reconhecimento de voz ativo', 'success');
  }
});

// ─── Menu navigation events ───────────────────────────────────────────────────
window.yami.onNavigate(page => navigate(page));

// ─── Tamagoshi life cycle ─────────────────────────────────────────────────────
setInterval(() => {
  // Slowly decrease energy, increase happiness over time
  const now = new Date();
  const hour = now.getHours();
  const isNight = hour < 6 || hour > 22;

  if (isNight) {
    updateStats(Math.max(20, STATE.energy - 0.5), Math.min(100, STATE.happiness + 0.2), STATE.learning);
    setTamaMood('sleeping');
  } else {
    updateStats(Math.max(30, STATE.energy - 0.1), Math.min(100, STATE.happiness + 0.1), STATE.learning);
    if (STATE.wsReady) setTamaMood('idle');
  }
}, 60000); // Every minute

// ─── Reminder checking ────────────────────────────────────────────────────────
async function checkReminders() {
  const now = Date.now();
  const soon = now + 16 * 60 * 1000; // next 16 minutes
  const events = await window.yami.events.get({ start: now, end: soon });
  events.forEach(evt => {
    const reminderTime = evt.start_time - (evt.reminder_minutes || 15) * 60000;
    if (reminderTime >= now - 60000 && reminderTime <= now + 60000) {
      window.yami.notify(`Lembrete: ${evt.title}`, `Começa em ${evt.reminder_minutes || 15} minutos`);
      if (STATE.ttsEnabled) window.yami.tts.speak(`Lembrete: ${evt.title} em ${evt.reminder_minutes || 15} minutos`);
    }
  });
}
setInterval(checkReminders, 60000);

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadConfig();
  if (STATE.config?.initialized) {
    applyConfig(STATE.config);
    await loadChatHistory();
    await checkIntegrations();
    // Delayed WS connection to let gateway start
    setTimeout(connectWS, 3000);
    // Check gateway status every 30s
    setInterval(() => window.yami.gateway.status().then(gw => updateGatewayStatus(gw.running)), 30000);
  }
}

init().catch(console.error);
