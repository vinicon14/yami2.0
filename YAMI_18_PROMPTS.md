# YAMI — 18 Prompts Conceituais para Codex

## Visão Geral
YAMI é uma IA pessoal completa, visual, por voz, por texto e com controle profundo do computador. Fork baseado em OpenClaw/OpenCloud inspirado em Hermes.

---

## BLOCO 1: NÚCLEO DE INTERAÇÃO (Prompts 1-6)

### Prompt 1: Ativação e Responsividade por Voz
Desenvolver sistema de wake-word "YAMI" (estilo Alexa) que:
- Escuta constantemente em background
- Ativa instantaneamente ao ouvir a palavra-chave
- Retorna feedback auditivo confirmando ativação
- Mantém contexto da conversação
- Processa comandos sem latência perceptível

### Prompt 2: Modo Talk — Conversa Natural Contínua
Implementar modo conversacional onde:
- YAMI responde naturalmente em português
- Mantém memória de contexto entre turnos
- Usa tom personalizado e adaptável
- Oferece sugestões proativas
- Interrompe e executa ações quando necessário

### Prompt 3: Interface Tamagotchi Minimalista
Criar interface visual de IA pessoal com:
- Avatar minimalista e animado (estilo Tamagotchi)
- Indicador visual de estado (pensando, ouvindo, falando)
- Animações suaves e responsivas
- Ocupa apenas canto da tela
- Integração com barra de sistema

### Prompt 4: Feedback Constante e Inteligente
Sistema de feedback que:
- Confirma comandos reconhecidos
- Mostra progresso de tarefas longas
- Fornece mensagens de erro claras
- Celebra conclusões e marcos
- Aprende preferências de comunicação do usuário

### Prompt 5: Aprendizado de Hábitos e Contexto
Motor de aprendizado que:
- Registra padrões diários (horários, tarefas, pessoas)
- Prediz próximas ações baseado em contexto
- Oferece automação adaptada ao usuário
- Evolui com uso e feedback
- Respeita privacidade e controle local

### Prompt 6: Integração com Voz, Texto e Gestos
Multimodal input/output:
- Comando por voz com alta precisão
- Chat textual com historico
- Gestos e cliques
- Alternância fluida entre modalidades
- Contextualização automática entre canais

---

## BLOCO 2: CONTROLE E AUTOMAÇÃO (Prompts 7-12)

### Prompt 7: Acesso Amplo ao Sistema Operacional
Capacidades de controle:
- Executar programas e scripts
- Manipular arquivos e pastas
- Acessar configurações de sistema
- Monitorar recursos (CPU, memória, rede)
- Controle de periféricos (mouse, teclado, câmera)

### Prompt 8: Integração com WhatsApp, Agenda e Arquivos
Acesso a dados pessoais:
- Ler/enviar mensagens WhatsApp via API
- Gerenciar eventos de calendário
- Navegar e organizar arquivos
- Buscar e indexar fotos
- Sincronizar entre dispositivos

### Prompt 9: Login Automatizado e Acesso Seguro
Sistema de autenticação:
- Armazenar credenciais de forma segura
- Auto-login em sites e apps
- Preencher formulários inteligentemente
- Gerenciar senhas com criptografia
- Verificação biométrica quando necessário

### Prompt 10: Automação Inteligente com Codex
Integração com Codex para:
- Gerar scripts customizados
- Criar macros e automações
- Programar fluxos complexos
- Evoluir automações baseado em uso
- Sincronizar com a nuvem pessoal

### Prompt 11: Acesso Remoto e Sincronização
Capacidades remotas:
- Controlar computador remotamente via app/web
- Sincronizar estado entre dispositivos
- Backup automático de dados pessoais
- Acesso à YAMI de qualquer lugar
- Criptografia end-to-end para dados sensíveis

### Prompt 12: Autoevolução e Atualização de Sistema
Sistema auto-melhorante:
- Detectar novas capacidades disponíveis
- Atualizar modelos de IA localmente
- Aprender novos padrões de uso
- Otimizar performance com uso
- Versionar e rollback quando necessário

---

## BLOCO 3: PORTABILIDADE E CONFIGURAÇÃO (Prompts 13-18)

### Prompt 13: Instalação via Pendrive (Portável)
Distribuição e setup:
- Arquivo único executável para Windows/Mac/Linux
- Instalação zero-config ou wizard simples
- Armazenar dados em pendrive/nuvem pessoal
- Funciona offline com fallback local
- Setup automático de dependências

### Prompt 14: APK, EXE e Componentes Integrados
Bundling de componentes:
- EXE único para desktop (Windows/Mac/Linux)
- APK para Android
- Versão web para browser
- Todos compartilham mesmo banco de dados
- Sincronização em tempo real entre plataformas

### Prompt 15: OpenClaw/OpenCloud no Backend
Infraestrutura:
- Rodar OpenClaw localmente (LLM)
- OpenCloud para sincronização pessoal
- Hermes como camada de integração
- Modelos otimizados para hardware local
- Suporte para GPU/CPU conforme disponível

### Prompt 16: Banco de Dados Pessoal e Privado
Armazenamento:
- Banco de dados SQLite/local por padrão
- Opção de sincronizar para nuvem pessoal
- Criptografia de dados em repouso
- Backup automático e versionamento
- Controle total sobre dados do usuário

### Prompt 17: Personalização Visual do Tamagotchi
Customização:
- Alterar avatar, cores, nome, voz
- Ajustar tom de personalidade
- Temas da interface (escuro, claro, custom)
- Animações e efeitos personalizáveis
- Carregar skins customizadas

### Prompt 18: Sistema de Amigos YAMI (Redes Descentralizadas)
Comunidade e compartilhamento:
- Conectar com outras YAMI de amigos
- Compartilhar automações e scripts
- Trocar dados de aprendizado consensualmente
- Criar grupos de YAMI colaborativas
- Rede descentralizada P2P opcional

---

## Estrutura de Implementação

### Fase 1: MVP (Semanas 1-4)
- Prompts 1-6: Core de interação
- Prompt 13: Instalação básica
- Interface Tamagotchi funcional

### Fase 2: Controle (Semanas 5-8)
- Prompts 7-12: Automação e controle
- Integração com APIs
- Primeiros casos de uso reais

### Fase 3: Portabilidade (Semanas 9-12)
- Prompts 14-18: Multi-plataforma, customização, comunidade
- Refinamento e otimizações
- Beta público

---

## Próximos Passos
1. Criar repositório GitHub
2. Setup infraestrutura (OpenClaw + OpenCloud)
3. Iniciar desenvolvimento do Prompt 1-3
4. Criar primeiro build executável
5. Integrar com Codex para auto-geração de código
