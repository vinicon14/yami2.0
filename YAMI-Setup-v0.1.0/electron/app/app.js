// YAMI Desktop App - Main UI Logic

class YAMIApp {
  constructor() {
    this.currentPage = 'home';
    this.config = null;
    this.ws = null;
    this.tamagoshiStates = {
      happy: '😊',
      excited: '🤩',
      thinking: '🤔',
      sad: '😢',
      sleeping: '😴'
    };
    this.selectedTamagoshi = 'happy';
    this.tamagoshiOptions = {
      '😊': 'Feliz',
      '🤖': 'Robot',
      '👾': 'Retro',
      '🐱': 'Gato',
      '🦄': 'Unicórnio',
      '🌟': 'Mágico'
    };
    this.voiceOptions = ['Google', 'Azure', 'Natural'];
    this.selectedVoice = 'Google';

    this.init();
  }

  async init() {
    this.config = await window.yami.getConfig();
    
    if (!this.config || !this.config.initialized) {
      this.showOnboarding();
    } else {
      this.initializeApp();
    }
  }

  showOnboarding() {
    const root = document.getElementById('root');
    const onboarding = document.createElement('div');
    onboarding.className = 'onboarding';
    onboarding.id = 'onboarding';
    onboarding.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-title">Bem-vindo ao YAMI! 🚀</div>

        <!-- Step 1: Welcome -->
        <div class="onboarding-step active" data-step="1">
          <p style="font-size: 14px; color: rgba(203, 213, 225, 0.8); margin-bottom: 30px;">
            Vamos configurar seu assistente de IA pessoal em poucos passos simples.
          </p>
          <p style="font-size: 13px; color: rgba(203, 213, 225, 0.6);">
            Você precisará escolher:
          </p>
          <ul style="text-align: left; font-size: 13px; color: rgba(203, 213, 225, 0.7); margin: 20px 0;">
            <li>✓ Conta Google (para sincronização)</li>
            <li>✓ Aparência do seu tamagoshi</li>
            <li>✓ Voz preferida</li>
            <li>✓ Integrações (WhatsApp, Telegram, etc)</li>
          </ul>
        </div>

        <!-- Step 2: Google Login -->
        <div class="onboarding-step" data-step="2">
          <p style="font-size: 14px; color: rgba(203, 213, 225, 0.8); margin-bottom: 20px;">
            Faça login com sua conta Google
          </p>
          <button class="btn" style="width: 100%; margin-bottom: 15px;">
            🔐 Conectar com Google
          </button>
          <p style="font-size: 12px; color: rgba(203, 213, 225, 0.5);">
            Seus dados estão seguros. Não compartilhamos com terceiros.
          </p>
        </div>

        <!-- Step 3: Choose Tamagoshi -->
        <div class="onboarding-step" data-step="3">
          <p style="font-size: 14px; color: rgba(203, 213, 225, 0.8); margin-bottom: 20px;">
            Escolha a aparência do seu assistente
          </p>
          <div class="tamagoshi-options">
            <div class="tamagoshi-option selected" data-emoji="😊" title="Feliz">😊</div>
            <div class="tamagoshi-option" data-emoji="🤖" title="Robot">🤖</div>
            <div class="tamagoshi-option" data-emoji="👾" title="Retro">👾</div>
            <div class="tamagoshi-option" data-emoji="🐱" title="Gato">🐱</div>
            <div class="tamagoshi-option" data-emoji="🦄" title="Unicórnio">🦄</div>
            <div class="tamagoshi-option" data-emoji="🌟" title="Mágico">🌟</div>
          </div>
          <p id="selected-emoji" style="font-size: 12px; color: #60a5fa; margin-top: 15px;">
            Selecionado: 😊 Feliz
          </p>
        </div>

        <!-- Step 4: Choose Voice -->
        <div class="onboarding-step" data-step="4">
          <p style="font-size: 14px; color: rgba(203, 213, 225, 0.8); margin-bottom: 20px;">
            Qual voz você prefere?
          </p>
          <div class="form-group">
            <label>Voz do Assistente</label>
            <select id="voice-select">
              <option value="google">🔊 Google (Natural)</option>
              <option value="azure">🎙️ Azure (Profissional)</option>
              <option value="natural">🌟 Natural (Realista)</option>
            </select>
          </div>
          <button class="btn" style="width: 100%;">🔊 Testar Voz</button>
          <p style="font-size: 12px; color: rgba(203, 213, 225, 0.5); margin-top: 15px;">
            Você pode mudar isso depois nas configurações
          </p>
        </div>

        <!-- Step 5: Integrations -->
        <div class="onboarding-step" data-step="5">
          <p style="font-size: 14px; color: rgba(203, 213, 225, 0.8); margin-bottom: 20px;">
            Quer conectar a integrações?
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
            <button class="btn" style="font-size: 12px;">📱 WhatsApp</button>
            <button class="btn" style="font-size: 12px;">📱 Telegram</button>
            <button class="btn" style="font-size: 12px;">💬 Discord</button>
            <button class="btn" style="font-size: 12px;">📧 Email</button>
          </div>
          <p style="font-size: 12px; color: rgba(203, 213, 225, 0.5);">
            Você pode adicionar integrações depois
          </p>
        </div>

        <!-- Step 6: Complete -->
        <div class="onboarding-step" data-step="6">
          <div style="font-size: 40px; margin-bottom: 20px;">🎉</div>
          <p style="font-size: 16px; color: #60a5fa; margin-bottom: 10px;">
            Pronto!
          </p>
          <p style="font-size: 13px; color: rgba(203, 213, 225, 0.8);">
            Seu YAMI está configurado e pronto para usar.
          </p>
          <p style="font-size: 12px; color: rgba(203, 213, 225, 0.6); margin-top: 20px;">
            Comece a conversar ou explore as integrações.
          </p>
        </div>

        <div class="onboarding-buttons">
          <button class="btn btn-secondary" id="prev-btn" style="display: none;">← Voltar</button>
          <button class="btn" id="next-btn">Próximo →</button>
        </div>
      </div>
    `;

    root.appendChild(onboarding);
    this.setupOnboardingHandlers();
  }

  setupOnboardingHandlers() {
    let currentStep = 1;
    const totalSteps = 6;
    const steps = document.querySelectorAll('.onboarding-step');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    const updateStep = (step) => {
      steps.forEach(s => s.classList.remove('active'));
      document.querySelector(`[data-step="${step}"]`).classList.add('active');
      
      prevBtn.style.display = step > 1 ? 'block' : 'none';
      nextBtn.textContent = step === totalSteps ? '✨ Começar' : 'Próximo →';
    };

    nextBtn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        currentStep++;
        updateStep(currentStep);
      } else {
        this.completeOnboarding();
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStep(currentStep);
      }
    });

    // Tamagoshi selection
    document.querySelectorAll('.tamagoshi-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.tamagoshi-option').forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedTamagoshi = e.target.dataset.emoji;
        const name = this.tamagoshiOptions[this.selectedTamagoshi];
        document.getElementById('selected-emoji').textContent = `Selecionado: ${this.selectedTamagoshi} ${name}`;
      });
    });

    // Voice selection
    const voiceSelect = document.getElementById('voice-select');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        this.selectedVoice = e.target.value;
      });
    }
  }

  async completeOnboarding() {
    const config = {
      initialized: true,
      user: {
        name: 'User',
        email: null,
        tamagoshi: this.selectedTamagoshi
      },
      voice: this.selectedVoice,
      theme: 'dark',
      integrations: [],
      timestamp: new Date().toISOString()
    };

    await window.yami.saveConfig(config);
    this.config = config;

    document.getElementById('onboarding').remove();
    this.initializeApp();
  }

  initializeApp() {
    this.connectToGateway();
    this.setupEventListeners();
    this.updateTamagoshi();
  }

  async connectToGateway() {
    const gatewayUrl = await window.yami.getGatewayUrl();
    this.ws = new WebSocket(gatewayUrl);

    this.ws.addEventListener('open', () => {
      console.log('Conectado ao Gateway YAMI');
      this.updateTamagoshi('excited');
    });

    this.ws.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    this.ws.addEventListener('error', (error) => {
      console.error('Erro de conexão:', error);
      this.updateTamagoshi('sad');
    });
  }

  setupEventListeners() {
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    const sidebar = document.querySelectorAll('.sidebar-item');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    sidebar.forEach(item => {
      item.addEventListener('click', (e) => {
        sidebar.forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        this.currentPage = e.target.dataset.page;
        console.log('Página:', this.currentPage);
      });
    });
  }

  sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();

    if (!message) return;

    this.addMessage(message, 'user');
    input.value = '';

    // Simulate AI response
    setTimeout(() => {
      this.updateTamagoshi('thinking');
      setTimeout(() => {
        const response = `Você disse: "${message}". Estou processando sua mensagem...`;
        this.addMessage(response, 'ai');
        this.updateTamagoshi('happy');
      }, 1000);
    }, 500);
  }

  addMessage(text, sender) {
    const messagesDiv = document.getElementById('messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  updateTamagoshi(state = 'happy') {
    const emoji = document.getElementById('tamagoshi-emoji');
    if (emoji) {
      emoji.textContent = this.config?.user?.tamagoshi || this.tamagoshiStates[state];
    }

    // Simulate status changes
    document.getElementById('energy').textContent = Math.floor(Math.random() * 30 + 70) + '%';
    document.getElementById('happiness').textContent = Math.floor(Math.random() * 30 + 75) + '%';
    document.getElementById('learning').textContent = Math.floor(Math.random() * 30 + 65) + '%';
  }

  handleMessage(data) {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'chat') {
        this.addMessage(msg.text, 'ai');
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new YAMIApp();
});
