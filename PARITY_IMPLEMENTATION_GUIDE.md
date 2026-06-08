# Guia de Implementação: Paridade Total Voz-Chat

**Versão**: 1.0  
**Data**: Junho 8, 2026  
**Status**: Ativo

---

## 1. Visão Geral da Arquitetura

### 1.1 Camadas do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                    USER INTERFACES                            │
│  ┌──────────────┐              ┌──────────────────┐          │
│  │ Chat/CLI     │              │ Voice (Realtime) │          │
│  │ (Texto)      │              │ (Áudio)          │          │
│  └────────┬─────┘              └────────┬─────────┘          │
└───────────┼────────────────────────────┼──────────────────────┘
            │                            │
            └────────────────┬───────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│              COMMAND NORMALIZATION LAYER                      │
│  Input → [Chat Command / Voice Intent] → Standardized Action │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│            ACTION DISPATCHER (Interface-Agnostic)             │
│                 - Command Registry                            │
│                 - Tool Dispatcher                             │
│                 - Permission Checker                          │
│                 - Error Handler                               │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    EXECUTION LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Tools    │  │ Skills   │  │ Agents   │  │ System   │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│              RESPONSE FORMATTING LAYER                        │
│  Result → [Text Response / Audio Response / Visual] → Output  │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo de Execução

```
Text Input                          Voice Input
    │                                  │
    ▼                                  ▼
Chat Parser                     Voice Recognition (Whisper/API)
    │                                  │
    ▼                                  ▼
Command Pattern Matching       Intent/Slot Extraction
    │                                  │
    └────────────┬──────────────────────┘
                 │
                 ▼
         Normalize to Standard Action
                 │
                 ▼
         ACTION DISPATCHER (core logic - interface agnostic)
                 │
                 ▼
         Check Permissions & Validate
                 │
                 ▼
         Execute Tool/Command/Agent
                 │
         ┌───────┴───────┬──────────────┐
         │               │              │
         ▼               ▼              ▼
    Format as      Format as       Update
    Chat Reply     Voice Output     State
         │               │              │
         └───────┬───────┴──────────────┘
                 │
                 ▼
            Send to User
```

---

## 2. Componentes Estruturais

### 2.1 Command Registry (Sistema de Comando Unificado)

**Localização**: `runtime/core/src/commands/registry.ts`

```typescript
interface CommandEntry {
  id: string;
  
  // Identificação
  name: string;
  description: string;
  category: 'communication' | 'files' | 'calendar' | 'automation' | ...;
  
  // Interfaces disponíveis
  interfaces: {
    chat?: {
      pattern: RegExp | string;
      examples: string[];
    };
    voice?: {
      intents: string[];
      examples: string[];
      parameterMapping?: Record<string, string>;
    };
  };
  
  // Execução agnóstica
  execute: (ctx: CommandContext, params: Record<string, any>) => Promise<Result>;
  
  // Permissões
  requiredPermissions: string[];
  
  // Parity metadata
  parity: {
    status: 'full' | 'partial' | 'chat_only' | 'voice_only';
    testedOn: string[]; // ['chat', 'voice']
    equivalence: 'functional' | 'resultative';
  };
}

// Registro global
export const COMMAND_REGISTRY = new Map<string, CommandEntry>();

// Validação de paridade no boot
export function validateParityCompliance(): ParityReport {
  for (const [id, entry] of COMMAND_REGISTRY) {
    if (entry.parity.status === 'chat_only' || entry.parity.status === 'voice_only') {
      // ⚠️ Avisar que há gap de paridade
      logParityGap(id, entry.parity.status);
    }
  }
}
```

### 2.2 Tool System (Ferramentas Interface-Agnostic)

**Localização**: `runtime/core/src/tools/base.ts`

```typescript
interface Tool<TParams = any, TResult = any> {
  // Identificação
  id: string;
  name: string;
  description: string;
  
  // Schema de parâmetros (agnóstico de interface)
  schema: ToolSchema<TParams>;
  
  // Execução pura (sem conhecimento de interface)
  execute(ctx: ToolContext, params: TParams): Promise<TResult>;
  
  // Formatação de saída contextualizad
  formatOutput?(result: TResult, format: 'text' | 'audio'): string;
  
  // Informação de paridade
  parity: {
    supportedIn: ('chat' | 'voice')[];
    status: 'full' | 'partial' | 'experimental';
  };
}

// Implementação exemplo
export const createFileTool: Tool = {
  id: 'create_file',
  name: 'Criar Arquivo',
  description: 'Cria um arquivo com conteúdo especificado',
  
  schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Caminho do arquivo' },
      content: { type: 'string', description: 'Conteúdo do arquivo' },
      encoding: { type: 'string', default: 'utf-8' },
    },
    required: ['path', 'content'],
  },
  
  // ✅ Implementação única que serve chat E voz
  async execute(ctx, { path, content, encoding }) {
    await fs.promises.writeFile(path, content, encoding);
    return { success: true, path, bytes: content.length };
  },
  
  // ✅ Formatação adaptada
  formatOutput(result, format) {
    if (format === 'audio') {
      return `Arquivo criado com sucesso em ${result.path}`;
    }
    return `✅ Arquivo criado: ${result.path} (${result.bytes} bytes)`;
  },
  
  parity: {
    supportedIn: ['chat', 'voice'],
    status: 'full',
  },
};
```

### 2.3 Intent Parser (Para Voz)

**Localização**: `runtime/core/src/talk/intent-parser.ts`

```typescript
interface IntentPattern {
  intent: string;
  toolId: string;
  patterns: string[]; // Templates de padrões em PT-BR
  parameterMapping: Record<string, string>;
}

// Banco de padrões para voz
export const VOICE_INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'create_file',
    toolId: 'create_file',
    patterns: [
      'crie um arquivo chamado {filename}',
      'crie arquivo {filename}',
      'novo arquivo {filename} com conteúdo',
      'crie {filename} como',
    ],
    parameterMapping: {
      'filename': 'path',
      'conteúdo': 'content',
    },
  },
  // ... mais padrões
];

export async function parseVoiceIntent(
  transcription: string
): Promise<{ intent: string; toolId: string; params: Record<string, any> } | null> {
  // Usar NLP ou pattern matching para extrair intenção
  // Deve retornar mesmo formato que command parser
}
```

### 2.4 Command Parser (Para Chat)

**Localização**: `runtime/core/src/commands/parser.ts`

```typescript
interface ParsedCommand {
  commandId: string;
  toolId: string;
  params: Record<string, any>;
}

export function parseTextCommand(input: string): ParsedCommand | null {
  // Parsear /command param=value
  // Deve extrair ID do comando e parâmetros
  // Retorna mesmo formato que voice intent parser
}
```

### 2.5 Action Dispatcher (Núcleo Agnóstico)

**Localização**: `runtime/core/src/dispatcher/action-dispatcher.ts`

```typescript
export class ActionDispatcher {
  private commandRegistry: Map<string, CommandEntry>;
  private toolRegistry: Map<string, Tool>;
  
  async dispatch(action: {
    source: 'chat' | 'voice';
    commandId?: string;
    toolId?: string;
    params: Record<string, any>;
    context: ActionContext;
  }): Promise<ActionResult> {
    // ✅ Importante: Dispatcher não conhece a origem (source) da ação
    // ✅ Apenas orquestra execução de forma unificada
    
    const tool = this.toolRegistry.get(action.toolId);
    if (!tool) throw new Error(`Tool not found: ${action.toolId}`);
    
    // Validar permissões
    await this.checkPermissions(action.context.user, tool);
    
    // Executar (agnóstico de interface)
    const result = await tool.execute(action.context, action.params);
    
    // Formatar resposta de acordo com contexto
    return {
      success: true,
      data: result,
      formatted: tool.formatOutput?.(result, action.context.outputFormat),
    };
  }
}
```

---

## 3. Fluxo de Implementação: Adicionando Nova Feature

### 3.1 Passo 1: Definir a Tool

```typescript
// skills/comunicacao/send-message-tool.ts

export const sendMessageTool: Tool = {
  id: 'send_message',
  name: 'Enviar Mensagem',
  description: 'Envia mensagem para contato ou grupo',
  
  schema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Destinatário' },
      content: { type: 'string', description: 'Conteúdo da mensagem' },
      channel: { type: 'string', enum: ['whatsapp', 'email', 'sms'], default: 'whatsapp' },
    },
    required: ['recipient', 'content'],
  },
  
  async execute(ctx, { recipient, content, channel }) {
    // Implementação
    return await messagingService.send(recipient, content, channel);
  },
  
  formatOutput(result, format) {
    if (format === 'audio') {
      return `Mensagem enviada para ${result.recipient}`;
    }
    return `✅ Enviado para ${result.recipient}`;
  },
  
  parity: {
    supportedIn: ['chat', 'voice'],
    status: 'full',
  },
};
```

### 3.2 Passo 2: Registrar Comando de Chat

```typescript
// skills/comunicacao/chat-command.ts

export const sendMessageChatCommand: CommandEntry = {
  id: 'send_message',
  name: 'Enviar Mensagem',
  description: 'Envia mensagem de texto',
  
  interfaces: {
    chat: {
      pattern: /\/send[_-]message\s+(.+?)\s+"(.+)"/i,
      examples: [
        '/send_message João "Olá, tudo bem?"',
        '/send-message +5535999999999 "Teste"',
      ],
    },
  },
  
  async execute(ctx, { recipient, content, channel = 'whatsapp' }) {
    return await sendMessageTool.execute(ctx, { recipient, content, channel });
  },
  
  requiredPermissions: ['send_messages'],
  
  parity: {
    status: 'full',
    testedOn: ['chat', 'voice'],
    equivalence: 'functional',
  },
};
```

### 3.3 Passo 3: Registrar Padrões de Voz

```typescript
// skills/comunicacao/voice-intents.ts

export const sendMessageVoicePatterns: IntentPattern[] = [
  {
    intent: 'send_message',
    toolId: 'send_message',
    patterns: [
      'envie mensagem para {recipient} dizendo',
      'mande para {recipient}',
      'envie para {recipient}',
      'diga para {recipient}',
    ],
    parameterMapping: {
      'recipient': 'recipient',
      'conteúdo': 'content',
      'menção': 'content',
    },
  },
];
```

### 3.4 Passo 4: Registrar no Sistema

```typescript
// skills/comunicacao/skill.ts

export function registerComunicacaoSkill(registry: CommandRegistry) {
  registry.register(sendMessageChatCommand);
  registry.registerVoicePatterns(sendMessageVoicePatterns);
  registry.registerTool(sendMessageTool);
  
  // Validar paridade
  registry.validateParity('send_message');
}
```

### 3.5 Passo 5: Testes de Paridade

```typescript
// skills/comunicacao/__tests__/parity.test.ts

describe('Comunicação - Paridade Voz e Chat', () => {
  const ctx = createTestContext();
  
  describe('send_message', () => {
    it('funciona via chat command', async () => {
      const cmd = parseTextCommand('/send_message João "Olá"');
      const result = await dispatcher.dispatch({
        source: 'chat',
        ...cmd,
        context: ctx,
      });
      expect(result.success).toBe(true);
    });
    
    it('funciona via voice intent', async () => {
      const intent = await parseVoiceIntent('envie mensagem para João dizendo olá');
      const result = await dispatcher.dispatch({
        source: 'voice',
        ...intent,
        context: ctx,
      });
      expect(result.success).toBe(true);
    });
    
    it('produz resultados idênticos (parity check)', async () => {
      const chatResult = await dispatcher.dispatch({
        source: 'chat',
        toolId: 'send_message',
        params: { recipient: 'João', content: 'Olá' },
        context: ctx,
      });
      
      const voiceResult = await dispatcher.dispatch({
        source: 'voice',
        toolId: 'send_message',
        params: { recipient: 'João', content: 'Olá' },
        context: ctx,
      });
      
      expect(chatResult.data).toEqual(voiceResult.data);
    });
  });
});
```

---

## 4. Habilitação do Sistema de Voz

### 4.1 Ativação Inicial

```json
// yami.json - mudanças necessárias

{
  "talk": {
    "enabled": true,                    // ✅ Ativar
    "realtime": {
      "enabled": true,                  // ✅ Ativar
      "provider": "openai",
      "model": "gpt-4-realtime",
      "voice": "marin"
    }
  },
  "messages": {
    "tts": {
      "enabled": true                   // ✅ Ativar TTS
    }
  }
}
```

### 4.2 Integração de Wake Word

```typescript
// src/talk/wake-word.ts

export class WakeWordDetector {
  private wakeWords: string[] = ['acorda'];
  
  async detectWakeWord(audio: AudioBuffer): Promise<boolean> {
    // Usar pequeno modelo de detecção local
    // ou integrar com provider
  }
}
```

### 4.3 Voice Command Routing

```typescript
// src/talk/voice-command-router.ts

export class VoiceCommandRouter {
  async routeVoiceInput(transcription: string) {
    // 1. Parse intent
    const intent = await parseVoiceIntent(transcription);
    if (!intent) return { error: 'Intent not recognized' };
    
    // 2. Dispatch ação
    return await dispatcher.dispatch({
      source: 'voice',
      toolId: intent.toolId,
      params: intent.params,
      context: this.createVoiceContext(),
    });
  }
}
```

---

## 5. Validação Automatizada de Paridade

### 5.1 Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Verificando paridade voz-chat..."

npm run validate:parity || {
  echo "❌ Paridade violada! Veja PARITY_RULE.md"
  exit 1
}

npm run test:parity || {
  echo "❌ Testes de paridade falharam!"
  exit 1
}

echo "✅ Paridade verificada com sucesso"
```

### 5.2 Script de Validação

```typescript
// scripts/validate-parity.ts

import { COMMAND_REGISTRY } from '../src/commands/registry';
import { TOOL_REGISTRY } from '../src/tools/registry';

interface ParityGap {
  id: string;
  type: 'command' | 'tool';
  gap: 'voice_only' | 'chat_only' | 'no_tests';
  severity: 'error' | 'warning';
}

export async function validateParityCompliance(): Promise<ParityGap[]> {
  const gaps: ParityGap[] = [];
  
  // Verificar todas as tools
  for (const [id, tool] of TOOL_REGISTRY) {
    if (!tool.parity.supportedIn.includes('chat')) {
      gaps.push({
        id,
        type: 'tool',
        gap: 'voice_only',
        severity: 'error',
      });
    }
    if (!tool.parity.supportedIn.includes('voice')) {
      gaps.push({
        id,
        type: 'tool',
        gap: 'chat_only',
        severity: 'error',
      });
    }
  }
  
  // Verificar cobertura de testes
  for (const [id, cmd] of COMMAND_REGISTRY) {
    if (cmd.parity.testedOn.length < 2) {
      gaps.push({
        id,
        type: 'command',
        gap: 'no_tests',
        severity: 'warning',
      });
    }
  }
  
  return gaps;
}

// Executar em build
if (import.meta.url === `file://${process.argv[1]}`) {
  const gaps = await validateParityCompliance();
  
  if (gaps.some(g => g.severity === 'error')) {
    console.error('❌ Paridade violada:');
    gaps.filter(g => g.severity === 'error').forEach(g => {
      console.error(`  - ${g.id} (${g.type}): ${g.gap}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Paridade validada com sucesso');
  console.log(`   ${gaps.length} warnings`);
}
```

### 5.3 Test Suite para Paridade

```typescript
// test/parity.test.ts

import { testAllTools } from './parity-helpers';

describe('Parity: Voice and Chat', () => {
  testAllTools(async (toolId, tool) => {
    if (!tool.parity.supportedIn.includes('chat')) {
      throw new Error(`Tool ${toolId} missing chat support`);
    }
    if (!tool.parity.supportedIn.includes('voice')) {
      throw new Error(`Tool ${toolId} missing voice support`);
    }
    
    // Testar equivalência funcional
    const chatResult = await executeThroughChat(toolId, { test: 'params' });
    const voiceResult = await executeThroughVoice(toolId, { test: 'params' });
    
    expect(chatResult.data).toEqual(voiceResult.data);
  });
});
```

---

## 6. Documentação Obrigatória por Skill

### 6.1 Template de SKILL.md

```markdown
# [Nome da Funcionalidade]

Breve descrição.

## Paridade: Voz e Chat

Esta funcionalidade está disponível em **ambas** as interfaces:

### Via Chat
\`\`\`
/comando parametro valor
\`\`\`

Exemplos:
- `/send_message João "Olá"`
- `/create_file test.txt`

### Via Voz
\`\`\`
Frase em linguagem natural
\`\`\`

Exemplos:
- "Envie mensagem para João dizendo olá"
- "Crie um arquivo chamado teste"

## Status de Paridade

- ✅ Implementação: Completa
- ✅ Testes: Ambas interfaces
- ✅ Documentação: Voz e Chat
- Status: **COMPLETO**

## Uso Avançado

### Parâmetros Opcionais
- `channel` (voz): "envie para João no WhatsApp" vs `/send_message João "..." --channel=whatsapp`

### Operações de Longa Duração
Se esta funcionalidade processa dados, ela:
- ✅ Não bloqueia input de voz
- ✅ Fornece feedback em tempo real
- ✅ Pode ser consultada por status

### Tratamento de Erros
Ambas interfaces recebem mesmos erros:
- "Contato não encontrado" (voz)
- "Contato não encontrado" (chat)
```

---

## 7. Monitoramento e Relatórios

### 7.1 Gerador de Relatório de Paridade

```typescript
// scripts/generate-parity-report.ts

interface ParityStats {
  totalTools: number;
  fullParityTools: number;
  voiceOnlyTools: number;
  chatOnlyTools: number;
  partialParityTools: number;
  coverage: string; // "85% tools with full parity"
}

export async function generateParityReport(): Promise<ParityStats> {
  const stats: ParityStats = {
    totalTools: TOOL_REGISTRY.size,
    fullParityTools: 0,
    voiceOnlyTools: 0,
    chatOnlyTools: 0,
    partialParityTools: 0,
    coverage: '',
  };
  
  for (const tool of TOOL_REGISTRY.values()) {
    if (tool.parity.status === 'full') stats.fullParityTools++;
    else if (tool.parity.supportedIn.includes('chat')) stats.chatOnlyTools++;
    else if (tool.parity.supportedIn.includes('voice')) stats.voiceOnlyTools++;
    else stats.partialParityTools++;
  }
  
  stats.coverage = `${
    ((stats.fullParityTools / stats.totalTools) * 100).toFixed(0)
  }% tools with full parity`;
  
  return stats;
}
```

### 7.2 Dashboard de Paridade

```bash
# Output de `npm run parity:report`

PARITY STATUS REPORT
====================

Total Tools: 156
Full Parity: 145 ✅
Partial Parity: 8 ⚠️
Voice Only: 2 ❌
Chat Only: 1 ❌

Coverage: 92.9%

Gaps:
❌ feature_x (chat_only) - assigned to @dev, due 2026-06-15
❌ feature_y (voice_only) - experimental, expires 2026-06-22
⚠️  feature_z (partial) - using adaptive parity

All new features must declare parity status before merge.
```

---

## 8. Checklist de Conformidade

### Antes de Cada Commit

- [ ] Nova funcionalidade tem interface de chat?
- [ ] Nova funcionalidade tem interface de voz?
- [ ] Ambas interfaces são testadas?
- [ ] Tool é agnóstica de interface?
- [ ] Sem bloqueios em operações longas?
- [ ] Documentação menciona ambas?
- [ ] Parity metadata preenchida?

### Antes de Cada Release

- [ ] `npm run validate:parity` passa
- [ ] `npm run test:parity` passa 100%
- [ ] Relatório de paridade gerado
- [ ] CHANGELOG menciona status de paridade
- [ ] Nenhuma feature sem parity (ou com data de expiração)

---

## 9. Troubleshooting

### Problema: "Tool não funciona em voz"

**Diagnóstico**:
1. Verificar se voice patterns estão registrados
2. Verificar intent parser está retornando params corretos
3. Executar ferramenta direto com mesmos params

**Solução**:
```typescript
// Adicionar debug
console.log('Intent detected:', intent);
console.log('Params mapped:', params);
console.log('Tool execution:', result);
```

### Problema: "Paridade validation falha em build"

**Verific**ar:
```bash
npm run validate:parity --verbose
npm run test:parity --verbose
```

**Resolver**:
1. Adicionar padrões de voz faltantes
2. Adicionar testes de chat faltantes
3. Atualizar parity metadata

---

## Referências

- PARITY_RULE.md: Especificação oficial
- runtime/yami-manifest.json: Module registry
- src/dispatcher/action-dispatcher.ts: Core dispatcher
- src/tools/: Sistema de tools
- src/commands/: Sistema de comandos

---

**Próximo Passo**: Ativar talk system e começar a migração de tools para suportar voz.
