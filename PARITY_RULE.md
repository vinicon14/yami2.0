# Regra 1: Paridade Total entre Voz e Chat

**Effective Date:** June 8, 2026  
**Status:** Fundamental Architecture Rule  
**Owner:** Yami Runtime Core

## Princípio Fundador

**Tudo o que o YAMI consegue fazer por texto deve poder ser feito por voz.**

Esta é a regra fundamental que governa todas as funcionalidades presentes e futuras do YAMI. Não podem existir funcionalidades exclusivas do chat ou exclusivas da voz. O sistema de voz é uma interface completa do sistema, não uma funcionalidade secundária.

---

## 1. Definições e Escopo

### 1.1 O que é Paridade?

Paridade significa:
- **Funcional**: Toda ação disponível em texto está disponível em voz
- **Experiencial**: A experiência é equivalente, não necessariamente idêntica
- **Intencional**: O resultado final é o mesmo independente do método de entrada
- **Não-Discriminatória**: Nenhum usuário é limitado por sua escolha de interface

### 1.2 Exemplos de Ações que Devem Ter Paridade

#### Gerenciamento de Informações
- ✅ Criar arquivos
- ✅ Editar código
- ✅ Organizar pastas
- ✅ Buscar arquivos por contexto
- ✅ Ler conteúdo de documentos

#### Comunicação
- ✅ Enviar mensagens
- ✅ Responder conversas
- ✅ Gerenciar contatos
- ✅ Marcar importante/lido
- ✅ Categorizar comunicações

#### Planejamento
- ✅ Criar eventos na agenda
- ✅ Agendar lembretes
- ✅ Definir rotinas
- ✅ Sincronizar com calendários
- ✅ Consultar tempo livre

#### Pesquisa e Navegação
- ✅ Navegar na internet
- ✅ Pesquisar informações
- ✅ Coletar dados
- ✅ Analisar resultados

#### Criação e Geração
- ✅ Gerar imagens
- ✅ Gerar documentos
- ✅ Escrever código
- ✅ Executar Scripts
- ✅ Processar dados

#### Automação
- ✅ Executar automações
- ✅ Controlar o computador
- ✅ Executar comandos do sistema
- ✅ Gerenciar processos
- ✅ Configurar sistemas

#### Integração
- ✅ Interagir com APIs
- ✅ Acionar agentes internos
- ✅ Solicitar modificações no próprio YAMI
- ✅ Gerenciar credenciais
- ✅ Configurar integrações

---

## 2. Requisitos Arquiteturais

### 2.1 Independência de Interface

O sistema deve ser arquitetado de forma que:

```
┌─────────────────────────────────────────────────────┐
│                 ACTION DISPATCHER                    │
│  (Centro de Orquestração Única de Todas as Ações)  │
└─────────┬───────────────────────────────────┬───────┘
          │                                   │
    ┌─────▼──────┐                   ┌─────▼──────┐
    │ Chat       │                   │ Voice      │
    │ Interface  │                   │ Interface  │
    └────────────┘                   └────────────┘
```

**Princípio**: 
- Interface é apenas a forma de INPUT
- O dispatcher central nunca conhece a origem da ação
- Toda lógica de comando é agnóstica à interface
- Saída pode ser adaptada ao contexto (texto/áudio/visual)

### 2.2 Ausência de Bloqueios em Operações de Longa Duração

Se uma ação exigir vários minutos para conclusão:

```
Operação Longa (Ex: Processar 1000 arquivos)
├─ Confirmação imediata via voz
├─ Processamento em background
└─ YAMI continua recebendo novos comandos de voz
```

**Requisitos**:
- Operações devem ser não-bloqueantes
- Usuário recebe confirmação imediata
- Fila de comandos continua processando
- Status pode ser consultado a qualquer momento
- Notificações quando concluído

### 2.3 Sistema de Ferramentas Unificado (Tools)

```typescript
// Exemplo: Uma tool é agnóstica à interface
tool {
  name: "create_file",
  description: "Criar arquivo com conteúdo",
  
  // Funciona identicamente em:
  // - Chat: /create_file content="..." name="..."
  // - Voice: "Crie um arquivo chamado relatório com este conteúdo..."
  
  // A tool não diferencia entre voz e texto
  // Apenas recebe parâmetros e executa
}
```

---

## 3. Exemplos de Análise de Paridade

### 3.1 Caso: Criar Arquivo ✅

| Aspecto | Chat | Voz | Paridade |
|---------|------|-----|----------|
| Funcionalidade | `/create_file name="test.md"` | "Crie um arquivo chamado test.md" | ✅ |
| Edição de Conteúdo | Digite conteúdo no chat | Dite conteúdo em áudio | ✅ |
| Confirmação | Mensagem no chat | Resposta em áudio | ✅ |
| Resultado | Arquivo criado | Arquivo criado | ✅ |

### 3.2 Caso: Editar Código ✅

| Aspecto | Chat | Voz | Paridade |
|---------|------|-----|----------|
| Abrir arquivo | `/open src/app.py` | "Abra o arquivo app.py" | ✅ |
| Ver conteúdo | Renderizado no chat | Lido em áudio | ✅ |
| Modificar | `/edit src/app.py` + novo código | "Mude a função calcular para..." | ✅ |
| Salvar | Automático ou `/save` | Automático | ✅ |
| Verificação | Ver resultado no chat | Ouvir leitura do resultado | ✅ |

### 3.3 Caso: Executar Automação ✅

| Aspecto | Chat | Voz | Paridade |
|---------|------|-----|----------|
| Iniciar | `/run automation backup` | "Execute a automação de backup" | ✅ |
| Parâmetros | `/run automation --opts value` | "Execute backup com opção value" | ✅ |
| Status | Exibe progresso em tempo real | Relata verbalmente a cada etapa | ✅ |
| Conclusão | Resultado no chat | Resultado confirmado em áudio | ✅ |
| Erros | Mensagem de erro visível | Erro descrito em áudio | ✅ |

### 3.4 Caso: Solicitar Mudanças no YAMI ✅

| Aspecto | Chat | Voz | Paridade |
|---------|------|-----|----------|
| Propor | "Adicione suporte para..." | "Adicione suporte para..." | ✅ |
| Discussão | Conversa interativa | Conversa por áudio | ✅ |
| Planejamento | Especificação em texto | Especificação por fala | ✅ |
| Implementação | Código gerado | Código gerado (mesmo) | ✅ |
| Feedback | Feedback via chat | Feedback via voz | ✅ |

---

## 4. Casos de Exceção (Raros)

Apenas em situações muito específicas, uma ação pode ter paridade **limitada**:

### 4.1 Ações Predominantemente Visuais

**Exemplo**: Selecionar item de uma lista com 100 opções

**Chat Adequado**: Apresenta todas as opções, usuário digita número  
**Voz Inadequado**: Ler 100 opções é impraticável  
**Solução de Paridade**:
- Voz: "Mostre as 5 primeiras opções" ou "Procure por padrão" ou "Qual é a mais recente?"
- Chat: Mesma seleção por busca/filtro
- Resultado: Ambas chegam à mesma conclusão por caminhos adaptados

### 4.2 Interações Altamente Visuais

**Exemplo**: Editar imagem visualmente

**Chat Adequado**: Editor visual ou descrição detalhada  
**Voz Inadequado**: Muito complexo descrever em áudio  
**Solução de Paridade**:
- Voz: "Ajuste o brilho em 20% e aumente saturação"
- Chat: Mesmo comando ou editor visual
- Resultado: Imagem modificada

**Princípio**: Mesmo que o *método* seja diferente, o *resultado* deve ser idêntico.

---

## 5. Implementação Obrigatória

### 5.1 Regra de Ouro para Novas Funcionalidades

```
┌─────────────────────────────────────────┐
│ NOVA FUNCIONALIDADE PROPOSTA?           │
├─────────────────────────────────────────┤
│ ✗ SEM SUPORTE POR VOZ = BLOQUEADO       │
│ ✓ COM SUPORTE POR VOZ = AUTORIZADO      │
├─────────────────────────────────────────┤
│ Checklist de Lançamento:                │
│ ☐ Função implementada em código         │
│ ☐ Tool/comando disponível               │
│ ☐ Interface de chat testada             │
│ ☐ Interface de voz testada              │
│ ☐ Testes de paridade criados            │
│ ☐ Documentação inclui ambas interfaces  │
│ ☐ Nenhum bloqueio foi adicionado        │
└─────────────────────────────────────────┘
```

### 5.2 Componentes que Precisam de Modificação

#### 2.2.1 Agent Runtime System
- `src/agents/`: Modificar dispatcher para ser agnóstico de interface
- `src/commands/`: Todas as commands precisam de handlers de voz equivalentes
- `src/tools/`: Tools devem ser agnósticas à origem da chamada

#### 2.2.2 Voice/Talk System
- `src/talk/`: Sistema de voz precisa suportar todas as tools
- `src/realtime-voice/`: Realtime voice provider precisa de integration completa
- `src/voicewake-routing/`: Sistema de roteamento de comandos de voz

#### 2.2.3 Skills
- Cada skill deve exportar:
  - `TEXT_COMMANDS`: Comandos para interface de texto
  - `VOICE_COMMANDS`: Equivalentes para interface de voz
  - `PARITY_MATRIX`: Mapa de paridade entre comandos

#### 2.2.4 Testes
- Tests devem ser duplicados para voz e texto
- Fixtures devem ser agnósticas
- Assertions devem validar equivalência funcional

---

## 6. Padrões de Implementação

### 6.1 Padrão: Tool com Suporte Completo

```typescript
// skills/exemplo/tool-criar-arquivo.ts
import { Tool, AgentContext } from '@yami/runtime';

export const createFileTool: Tool = {
  id: 'create_file',
  name: 'Criar Arquivo',
  description: 'Cria um novo arquivo com conteúdo',
  
  // ✅ Agnóstico de interface
  async execute(ctx: AgentContext, params: CreateFileParams) {
    // Implementação única que serve ambas interfaces
    return await fs.promises.writeFile(params.path, params.content);
  },
};

// ✅ Expose para chat
export const chatCommandCreateFile = {
  pattern: /\/create[_-]file\s+(.+)/i,
  tool: createFileTool,
};

// ✅ Expose para voz (natural language patterns)
export const voiceIntentCreateFile = {
  patterns: [
    'crie um arquivo chamado {filename}',
    'crie arquivo {filename} com conteúdo',
    'novo arquivo {filename}',
  ],
  tool: createFileTool,
  parameterMapping: {
    'filename': 'path',
    'conteúdo': 'content',
  },
};

// ✅ Validação de paridade
export const parityMatrix = {
  'create_file': {
    text: { command: '/create_file', status: 'implemented' },
    voice: { intent: 'create_file', status: 'implemented' },
    equivalence: 'full',
    tested: true,
  },
};
```

### 6.2 Padrão: Comando com Paridade Parcial

```typescript
// ✅ Ação permite paridade limitada
export const selectFromListTool: Tool = {
  id: 'select_from_list',
  
  // Chat: Opções numeradas
  chatInterface: {
    display: (items) => items.map((i, idx) => `${idx+1}. ${i}`).join('\n'),
    input: async () => /* user enters number */,
  },
  
  // Voz: Busca inteligente
  voiceInterface: {
    patterns: [
      'escolha {search_term}',
      'selecione o item mais recente',
      'qual é {adjective}',
    ],
  },
  
  // Resultado: Idêntico
  execute: async (ctx, params) => params.selected,
};
```

---

## 7. Verificação de Conformidade

### 7.1 Checklist de Review de Código

Antes de qualquer commit que adicione funcionalidade:

```bash
✓ Esta funcionalidade pode ser usada por voz?
✓ Existe correspondência de interface (voz <-> texto)?
✓ Os testes cobrem ambas interfaces?
✓ A documentação menciona ambas formas de uso?
✓ Não há operações bloqueantes de longa duração?
✓ Erros são tratados em ambas interfaces?
✓ A experiência é equivalente (não necessariamente idêntica)?
```

### 7.2 Teste de Paridade Automatizado

```typescript
// test/parity.test.ts
describe('Paridade: Voz e Chat', () => {
  testParityForAllTools(async (tool) => {
    // Para cada tool, verificar:
    ✓ Tool é agnóstica de interface
    ✓ Versão em chat existe
    ✓ Versão em voz existe
    ✓ Ambas produzem resultado idêntico
    ✓ Erros são tratados igual
    ✓ Sem bloqueios em operações longas
  });
});
```

### 7.3 Validação em Build

```bash
# parity-validator.js
npm run validate:parity
  ├─ Verificar todas as tools exportadas
  ├─ Validar parity matrix para cada uma
  ├─ Checar test coverage para ambas interfaces
  ├─ Confirmar sem novas exceções
  └─ Gerar relatório de conformidade
```

---

## 8. Roadmap: Habilitação do Sistema de Voz

### Fase 1: Fundação (Imediato)
- [ ] Ativar talk.enabled = true em yami.json
- [ ] Ativar talk.realtime.enabled = true
- [ ] Configurar providers de voz (OpenAI Realtime ou alternativa)
- [ ] Integrar wake word ("acorda")
- [ ] Testes básicos de reconhecimento

### Fase 2: Core Tools (Semanas 1-2)
- [ ] Comunicação: enviar mensagens, responder
- [ ] Gerenciamento de Arquivos: criar, abrir, editar
- [ ] Agenda: criar eventos, agendar lembretes
- [ ] Pesquisa: buscar na internet, pesquisar informações

### Fase 3: Automação (Semanas 2-3)
- [ ] Executar automações e scripts
- [ ] Controlar computador e aplicativos
- [ ] Gerenciar processos
- [ ] Interagir com APIs

### Fase 4: Criação (Semana 4)
- [ ] Gerar imagens
- [ ] Gerar documentos
- [ ] Escrever código
- [ ] Processar dados

### Fase 5: Self-Improvement (Ongoing)
- [ ] Solicitar modificações ao YAMI
- [ ] Sugerir melhorias
- [ ] Estender capabilities
- [ ] Integrar feedback

---

## 9. Documentação Obrigatória

### 9.1 Para Cada Nova Funcionalidade

```markdown
## [Nome da Funcionalidade]

### Paridade de Voz e Chat

| Método | Sintaxe | Exemplo |
|--------|---------|---------|
| **Chat** | `/comando param` | `/create_file test.txt` |
| **Voz** | Frase natural | "Crie um arquivo chamado teste" |
| **Status** | ✅ Implementado | Ambas funcionando |

### Usar em Voz
"Crie um arquivo chamado test.txt com conteúdo importante"

### Usar em Chat
```
/create_file test.txt
Este é o conteúdo importante
```
```

### 9.2 CHANGELOG: Acompanhar Paridade

```markdown
## [Versão] - Data

### Funcionalidades Adicionadas
- ✅ [Feature] com suporte completo: Chat + Voz
- ✅ [Feature] com paridade limitada: Chat (editor visual) + Voz (parâmetros)

### Correções
- 🔧 [Feature] agora funciona em voz (Paridade fix)
- 🔧 [Feature] operação não bloqueia mais voz (Background fix)
```

---

## 10. Governança e Enforcement

### 10.1 Responsabilidades

**Todos os Commits**:
- Developer: Verificar parity checklist antes de commit
- Pre-commit Hook: Validar parity matrix automaticamente
- Code Review: Verificar conformidade com esta regra

**Cada Release**:
- Parity Report: Gerar relatório de conformidade
- Changelog: Documentar status de paridade de cada feature
- Tests: Rodar suite completa de parity tests

### 10.2 Violações

Se uma funcionalidade for lançada **sem** suporte equivalente de voz:

1. **Status**: Marcada como ⚠️ EXPERIMENTAÇÃO
2. **Duração**: Máximo 1 release (7 dias)
3. **Ação**: Developer abre issue #parity-fix
4. **Prazo**: Implementação de voz no próximo release
5. **Se não completado**: Feature é desativada até paridade

---

## 11. FAQ

**P: E se for impossível implementar em voz?**  
R: Reformule a feature. Sempre há alternativa que permite paridade.

**P: Isso não torna o desenvolvimento mais lento?**  
R: Inicialmente sim, ~20-30% mais tempo. Mas ao longo do tempo, reduz complexity e manutenção. Usuários são mais felizes.

**P: E features visuais complexas?**  
R: Use paridade *resultativa*, não *metodológica*. O resultado final é o mesmo, o caminho pode ser diferente.

**P: Quem define se paridade é viável?**  
R: Code review + Lead Developer. Casos duvidosos vão para discussão de arquitetura.

**P: Como testo paridade em voz?**  
R: Use fixtures agnósticas de interface + testes paralelos para ambas entradas.

---

## 12. Referências

- OpenClaw Runtime: Agent dispatch system
- Hermes Voice System: Voice interface patterns
- YAMI Manifest: Module registry at `runtime/yami-manifest.json`
- Talk Configuration: `yami.json#talk`
- Realtime Voice Runtime: `dist/realtime-voice.runtime.js`

---

## Changelog

| Data | Versão | Mudança |
|------|--------|---------|
| 2026-06-08 | 1.0 | Regra fundamental estabelecida |

---

**Status**: ✅ ATIVA E OBRIGATÓRIA

Toda e qualquer funcionalidade adicionada ao YAMI após esta data **DEVE** conformar com esta regra.
