# Quick Start: Implementando Paridade Voz-Chat

**Tempo**: 5 minutos de leitura  
**Para**: Desenvolvedores adicionando nova feature

---

## TL;DR - A Regra em 3 Linhas

```
✅ Tudo que funciona em chat DEVE funcionar em voz
❌ Nenhuma feature chat-only ou voice-only
⏱️  Operações longas não bloqueiam voz
```

---

## Checklist Rápido (Antes de Commit)

```bash
□ Feature funciona em /chat?
□ Feature funciona em voz?
□ Teste de paridade existe?
□ Documentação menciona ambas?
□ npm run validate:parity passou?
```

Se algum não tiver ✅, não faça commit ainda.

---

## Exemplo Prático: Feature de "Enviar Mensagem"

### 1️⃣ Criar a Tool (Interface-Agnostic)

```typescript
// skills/messaging/send-message-tool.ts

export const sendMessageTool: Tool = {
  id: 'send_message',
  name: 'Enviar Mensagem',
  description: 'Envia mensagem para contato',
  
  schema: {
    properties: {
      to: { type: 'string' },
      content: { type: 'string' },
    },
  },
  
  // ✅ Implementação é agnóstica de interface
  async execute(ctx, { to, content }) {
    return await messaging.send(to, content);
  },
  
  // ✅ Metadados de paridade
  parity: {
    supportedIn: ['chat', 'voice'],  // Ambas!
    status: 'full',
  },
};
```

### 2️⃣ Adicionar Suporte em Chat

```typescript
// skills/messaging/chat-command.ts

export const sendMessageChat: CommandEntry = {
  id: 'send_message',
  interfaces: {
    chat: {
      pattern: /\/send[_-]message\s+(.+?)\s+"(.+)"/i,
      examples: ['/send_message João "Olá"'],
    },
  },
  async execute(ctx, params) {
    return await sendMessageTool.execute(ctx, params);
  },
  parity: {
    status: 'full',
    testedOn: ['chat', 'voice'],
    equivalence: 'functional',
  },
};
```

### 3️⃣ Adicionar Suporte em Voz

```typescript
// skills/messaging/voice-intents.ts

export const sendMessageVoicePatterns: IntentPattern[] = [
  {
    intent: 'send_message',
    toolId: 'send_message',
    patterns: [
      'envie mensagem para {to} dizendo',
      'mande para {to}',
      'diga para {to}',
    ],
    parameterMapping: {
      'to': 'to',
      'conteúdo': 'content',
    },
  },
];
```

### 4️⃣ Teste de Paridade

```typescript
// skills/messaging/__tests__/parity.test.ts

describe('send_message parity', () => {
  it('chat e voz produzem resultado igual', async () => {
    const chatResult = await dispatcher.dispatch({
      source: 'chat',
      toolId: 'send_message',
      params: { to: 'João', content: 'Olá' },
    });
    
    const voiceResult = await dispatcher.dispatch({
      source: 'voice',
      toolId: 'send_message',
      params: { to: 'João', content: 'Olá' },
    });
    
    expect(chatResult.data).toEqual(voiceResult.data);
  });
});
```

### 5️⃣ Documentar

```markdown
# Enviar Mensagem

### Chat
/send_message João "Olá, tudo bem?"

### Voz
"Envie mensagem para João dizendo olá tudo bem"

### Status
✅ Chat + Voz | Paridade Completa
```

---

## Estrutura de Diretórios (Padrão)

```
skills/
  minha-feature/
    ├── tool.ts              # ← Tool agnóstica
    ├── chat-command.ts      # ← Interface de chat
    ├── voice-intents.ts     # ← Interface de voz
    ├── skill.ts             # ← Exportador
    ├── SKILL.md             # ← Documentação
    └── __tests__/
        ├── unit.test.ts     # ← Testes da tool
        ├── chat.test.ts     # ← Testes de chat
        ├── voice.test.ts    # ← Testes de voz
        └── parity.test.ts   # ← Teste de paridade ✅
```

---

## Executar Validação

```bash
# Validar paridade
npm run validate:parity

# Rodar testes de parity
npm run test:parity

# Verbose para debug
npm run validate:parity -- --verbose
npm run test:parity -- --watch
```

---

## Casos Especiais

### Feature Visual Complexa?

**Exemplo**: Selecionar item de lista com 1000 opções

**Solução**:
- Chat: Exibe com busca/filtro
- Voz: "Procure por padrão" ou "Qual é a mais recente?"
- Resultado: Idêntico ✅

Use paridade **resultativa**, não **metodológica**.

### Operação Longa (> 5s)?

**Requisitos**:
```typescript
// ✅ Confirmação imediata
ctx.feedback("Iniciando... pode levar alguns minutos");

// ✅ Feedback em tempo real
await longOperation(onProgress => {
  ctx.feedback(`Progresso: ${onProgress.percent}%`);
});

// ✅ Não bloqueia voz
// Operação continua em background

// ✅ Notificação ao fim
ctx.notify("Operação concluída");
```

---

## Common Mistakes ❌

### ❌ Erro 1: Implementar só em Chat

```typescript
// ERRADO!
interfaces: {
  chat: { pattern: /\/comando/ },
  // Falta voice!
},
parity: { status: 'chat_only' },  // ❌
```

✅ **Correto**: Adicionar voice intents também

### ❌ Erro 2: Tool conhecer fonte do input

```typescript
// ERRADO!
async execute(ctx, params) {
  if (ctx.source === 'chat') {
    // Lógica diferente
  } else if (ctx.source === 'voice') {
    // Outra lógica
  }
}
```

✅ **Correto**: Tool é agnóstica
```typescript
async execute(ctx, params) {
  // Mesma lógica sempre
  return result;
}
```

### ❌ Erro 3: Sem testes de paridade

```typescript
// ERRADO!
// __tests__/feature.test.ts tem tests, mas
// não testa paridade entre chat e voz
```

✅ **Correto**: Adicionar `parity.test.ts`
```typescript
// __tests__/parity.test.ts
it('chat e voz resultados iguais', async () => {
  // Comparar resultados
});
```

---

## Dúvidas Frequentes

### P: E se não souber como fazer em voz?

**R**: Leia os exemplos em `PARITY_RULE.md` seção 3 ou `PARITY_IMPLEMENTATION_GUIDE.md` seção 3.

### P: Posso lançar com paridade parcial?

**R**: Apenas com aprovação explícita do tech lead. Max 7 dias. Requer plano de remediação.

### P: Como testar voz localmente?

**R**: Use mocks em testes. Em staging, teste com voice input real.

### P: Commit é rejeitado no pre-commit hook?

**R**: 
1. Ler output do hook
2. Adicionar suporte de voz faltante
3. Rodar `npm run validate:parity`
4. Retry commit

---

## Fluxo Prático

### 1. Iniciar Feature

```bash
mkdir -p skills/minha-feature/__tests__
touch skills/minha-feature/{tool,chat-command,voice-intents,skill}.ts
```

### 2. Implementar Tool

```bash
# Editar: tool.ts
# - Implementar execute() agnóstico
# - Adicionar parity metadata
```

### 3. Adicionar Chat

```bash
# Editar: chat-command.ts
# - Registrar pattern
# - Validar funciona
```

### 4. Adicionar Voz

```bash
# Editar: voice-intents.ts
# - Adicionar patterns naturais
# - Testar reconhecimento
```

### 5. Testar Paridade

```bash
# Editar: __tests__/parity.test.ts
# - Chat result === Voice result
npm run test:parity
```

### 6. Documentar

```bash
# Criar: SKILL.md
# - Exemplos chat + voz
# - Status de paridade
```

### 7. Validar & Commit

```bash
npm run validate:parity  # ✅
git add .
git commit -m "Feat: Minha Feature (Chat + Voice Parity ✅)"
```

---

## Template Mínimo de Commit

```bash
git commit -m "

Feat: Nome da Funcionalidade

- ✅ Chat: /comando funciona
- ✅ Voz: 'frase natural' funciona
- ✅ Testes de paridade: PASS
- ✅ Documentação: SKILL.md atualizado

Parity Status: FULL ✅
"
```

---

## Recursos

| Recurso | Leitura |
|---------|---------|
| **Regra Completa** | `PARITY_RULE.md` (10 min) |
| **Guia Técnico** | `PARITY_IMPLEMENTATION_GUIDE.md` (20 min) |
| **Checklist** | `FEATURE_PARITY_CHECKLIST.md` (5 min) |
| **Exemplos** | `PARITY_IMPLEMENTATION_GUIDE.md` seção 3 |

---

## Próximo Passo

✅ Ler este documento  
→ Implementar sua feature seguindo o exemplo  
→ Rodar validação  
→ Fazer commit  

---

**Precisa de ajuda?** Veja `PARITY_RULE.md` ou `PARITY_IMPLEMENTATION_GUIDE.md`

**Dúvida arquitetural?** Abra issue com tag `[parity]`

**Exceção necessária?** Solicite ao tech lead com justificativa técnica
