# Sistema de Análise e Adaptação ao Estilo de Escrita do Usuário (YAMI)

## Visão Geral

O YAMI agora possui um **Sistema Avançado de Análise e Adaptação de Estilo de Escrita** que aprende como o usuário se comunica e pode reproduzir seu padrão pessoal de linguagem quando solicitado.

## Recursos Principais

### 1. **Análise Contínua de Padrões**
O sistema analisa automaticamente cada mensagem do usuário para extrair:

- **Formalidade**: Detecção entre formal, casual ou neutro
- **Tom Emocional**: Otimista, negativo, neutro, entusiasmado, melancólico
- **Nível de Vocabulário**: Simples, intermediário ou avançado
- **Estrutura de Frases**: Simples, moderada ou complexa
- **Comprimento Médio de Mensagens**: Em caracteres
- **Frequência de Emojis**: Média de emojis por mensagem
- **Uso de Gírias**: Percentual de termos coloquiais
- **Formas de Cumprimento**: "Oi", "Olá", "Opa", etc.
- **Formas de Encerramento**: "Abraços", "Valeu", "Flw", etc.
- **Expressões Recorrentes**: Frases características usadas frequentemente
- **Vocabulário Característico**: Palavras mais frequentes

### 2. **Adaptação Gradual**
- O sistema começa com baixa confiança e aumenta gradualmente conforme aprende
- Cada interação refina o perfil com mais dados
- Mínimo de confiança: 10% | Máximo: 95%
- Incremento de confiança por mensagem similar: +4%
- Decremento por padrão diferente: -2%

### 3. **Consistência Estilística**
- Mantém coerência com os padrões aprendidos
- Adapta respostas para refletir o estilo pessoal
- Preserva autenticidade e clareza

### 4. **Armazenamento Persistente**
- Arquivo: `~/.yami/learning-engine/writing-style.json`
- Histórico: Últimas 200 mensagens analisadas
- Retenção: Dados envelhecem após 60 dias sem uso

## Como Usar

### Verificar Perfil de Estilo

```bash
yami pendrive style
# ou
yami pendrive style profile
```

Mostra o perfil de estilo aprendido com:
- Nível de formalidade e confiança
- Tom predominante
- Nível de vocabulário
- Estrutura de frases
- Comprimento médio
- Cumprimentos e enceramentos típicos
- Expressões recorrentes
- Total de mensagens analisadas
- Confiança geral do perfil

### Obter Instruções de Estilo

```bash
yami pendrive style instructions
```

Exibe instruções detalhadas de como o usuário se comunica, úteis para:
- Entender o padrão pessoal
- Comunicar estilo para terceiros
- Referência manual

### Ver Dicas de Adaptação

```bash
yami pendrive style hints
```

Mostra dicas sobre:
- Padrões emergentes
- Estilos bem estabelecidos
- Características especiais (uso frequente de emojis, etc.)

### Controlar o Sistema

#### Ativar Análise
```bash
yami pendrive style enable
```

#### Desativar Análise
```bash
yami pendrive style disable
```

Quando desativado, o sistema não analisa mais mensagens, mas mantém os dados já coletados.

#### Resetar Perfil
```bash
yami pendrive style reset
```

Limpa completamente o perfil de estilo, iniciando o aprendizado do zero.

## Integração com o Sistema

### No Código JavaScript

```javascript
import { LearningEngine } from './learning-engine/index.mjs';

const engine = new LearningEngine().initialize();

// Registrar uma mensagem do usuário
engine.recordMessage("Opa! Tudo bem? Preciso de uma ajuda com um projeto.");

// Obter resumo do perfil
const summary = engine.getWritingProfileSummary();

// Obter instruções para o LLM
const instructions = engine.getWritingStyleInstructions();

// Construir resposta adaptada
const response = engine.buildResponseWithWritingStyle(
  "Claro! Fico feliz em ajudar.",
  "Opa! Tudo bem? Preciso de uma ajuda com um projeto."
);

// Habilitar/desabilitar
engine.setWritingStyleEnabled(true);
engine.setWritingStyleEnabled(false);

// Resetar
engine.resetWritingProfile();

// Verificar se está ativado
const isEnabled = engine.isWritingStyleEnabled();

// Obter injeção de prompt para LLM
const promptBlock = engine.buildWritingStylePromptInjection();
```

### Prompt Injection para LLM

O sistema fornece um bloco XML com o perfil de estilo que pode ser injetado no prompt do modelo:

```xml
<writing_style_profile>
  <formality confidence="65%">casual</formality>
  <tone confidence="50%">enthusiastic</tone>
  <vocabulary_level confidence="45%">simple</vocabulary_level>
  <sentence_structure confidence="40%">simple</sentence_structure>
  <avg_message_length>120 caracteres</avg_message_length>
  <emoji_frequency>0.5 por mensagem</emoji_frequency>
  <typical_greeting>"Opa"</typical_greeting>
  <typical_signoff>"Valeu"</typical_signoff>
  <recurring_expressions>
    <expression>tudo bem</expression>
    <expression>com certeza</expression>
    <expression>bacana</expression>
  </recurring_expressions>
  <characteristic_vocabulary>
    <word frequency="5">projeto</word>
    <word frequency="4">ajuda</word>
    <word frequency="3">legal</word>
  </characteristic_vocabulary>
  <style_established_confidence>52%</style_established_confidence>
</writing_style_profile>
```

## Estrutura de Dados

### Arquivo: `writing-style.json`

```json
{
  "version": 1,
  "enabled": true,
  "lastUpdated": "2026-06-08T15:30:45.123Z",
  "totalMessages": 45,
  "style": {
    "formality": {
      "value": "casual",
      "confidence": 0.65
    },
    "tone": {
      "value": "enthusiastic",
      "confidence": 0.50
    },
    "vocabularyLevel": {
      "value": "simple",
      "confidence": 0.45
    },
    "sentenceStructure": {
      "value": "simple",
      "confidence": 0.40
    },
    "avgMessageLength": 120,
    "avgWordsPerSentence": 8.5,
    "emojiFrequency": 0.5,
    "slangFrequency": 0.15,
    "dominantTone": {
      "value": "positive",
      "confidence": 0.6,
      "distribution": {
        "positive": 0.6,
        "neutral": 0.3,
        "negative": 0.1
      }
    }
  },
  "vocabulary": [
    {"word": "projeto", "count": 5, "firstSeen": "...", "lastSeen": "..."},
    {"word": "ajuda", "count": 4, "firstSeen": "...", "lastSeen": "..."}
  ],
  "expressions": [
    {"text": "tudo bem", "type": "phrase", "count": 8, "firstSeen": "...", "lastSeen": "..."},
    {"text": "com certeza", "type": "phrase", "count": 5, "firstSeen": "...", "lastSeen": "..."}
  ],
  "greetings": [
    {"text": "Opa", "count": 10, "firstSeen": "...", "lastSeen": "..."},
    {"text": "Olá", "count": 3, "firstSeen": "...", "lastSeen": "..."}
  ],
  "signoffs": [
    {"text": "Valeu", "count": 8, "firstSeen": "...", "lastSeen": "..."},
    {"text": "Abraços", "count": 5, "firstSeen": "...", "lastSeen": "..."}
  ],
  "toneHistory": [
    {"tone": "positive", "timestamp": "..."},
    {"tone": "enthusiastic", "timestamp": "..."}
  ],
  "messages": [
    {
      "text": "Opa! Tudo bem?",
      "timestamp": "...",
      "charCount": 14,
      "wordCount": 3
    }
  ]
}
```

## Componentes do Sistema

### 1. **WritingStyleStore.mjs**
Gerencia persistência de dados:
- Salva e carrega o perfil de estilo
- Atualiza métricas individuais
- Calcula confiança geral
- Remove dados antigos (decay)

### 2. **WritingStyleProfiler.mjs**
Analisa o conteúdo das mensagens:
- Detecta formalidade
- Extrai vocabulário
- Analisa estrutura de frases
- Identifica tom emocional
- Conta emojis
- Detecta gírias
- Extrai cumprimentos, enceramentos e expressões

### 3. **WritingStyleRenderer.mjs**
Gera instruções para o LLM:
- Cria bloco XML para injeção de prompt
- Fornece instruções em linguagem natural
- Calcula estilo de resposta alvo
- Formata mensagens com estilo

### 4. **LearningEngine (index.mjs)**
Orquestra todo o sistema:
- Integra componentes
- Fornece API pública
- Gerencia ciclo de vida

## Casos de Uso

### 1. Responder Mensagens
Quando solicitado responder uma mensagem em nome do usuário, o sistema adapta o tom, formalidade e estrutura:

```javascript
const response = engine.buildResponseWithWritingStyle(
  message,
  userInput
);
```

### 2. Redigir E-mails
O sistema fornece instruções de estilo para o LLM adaptar e-mails:

```javascript
const instructions = engine.getWritingStyleInstructions("email");
```

### 3. Criar Textos
Textos criados refletem padrão pessoal de linguagem:

```javascript
engine.recordMessage(userText);
const style = engine.buildResponseWithWritingStyle(generatedText);
```

### 4. Produzir Respostas Automáticas
Respostas automáticas mantêm estilo consistente:

```javascript
const stylized = engine.buildResponseWithWritingStyle(autoReply);
```

## Princípios de Design

✓ **Adaptação Gradual**: Começa com baixa confiança, aumenta com dados  
✓ **Aprendizado Contínuo**: Atualiza a cada nova mensagem  
✓ **Consistência Estilística**: Mantém padrões reconhecíveis  
✓ **Personalização**: Cada usuário tem perfil único  
✓ **Transparência**: Usuário pode visualizar e controlar o perfil  
✓ **Flexibilidade**: Pode resetar, desativar ou editar manualmente  

## Exemplo de Uso Completo

```javascript
import { LearningEngine } from './learning-engine/index.mjs';

async function main() {
  // Inicializar
  const engine = new LearningEngine().initialize();

  // Registrar mensagens do usuário
  engine.recordMessage("Opa! Tudo certo? Preciso de ajuda com um projeto!");
  engine.recordMessage("Bacana demais! Com certeza.");
  engine.recordMessage("Valeu pela ajuda, mano!");

  // Ver o perfil aprendido
  const summary = engine.getWritingProfileSummary();
  console.log(summary);
  // {
  //   formality: { value: 'casual', confidence: 0.65 },
  //   tone: { value: 'enthusiastic', confidence: 0.50 },
  //   topGreeting: 'Opa',
  //   topSignoff: 'Valeu',
  //   ...
  // }

  // Usar para responder mensagem
  const userInput = "Opa! Tudo bem? Preciso de ajuda com um projeto!";
  const response = "Claro! Fico feliz em ajudar com seu projeto.";
  
  const styledResponse = engine.buildResponseWithWritingStyle(
    response,
    userInput
  );
  
  console.log(styledResponse);
  // "Opa, claro! Fico feliz em ajudar com seu projeto!\nValeu"
}

main();
```

## FAQ

**P: Como o sistema sabe quando registrar uma mensagem?**  
R: O sistema fornece um método `recordMessage()` que deve ser chamado quando o usuário envia uma mensagem. Isso é integrado no gateway ou sistema de processamento de mensagens.

**P: O sistema funciona offline?**  
R: Sim! Todos os dados são armazenados localmente em JSON. O aprendizado acontece localmente sem necessidade de conectividade.

**P: Posso resetar o perfil manualmente?**  
R: Sim, use `yami pendrive style reset` ou `engine.resetWritingProfile()`.

**P: O sistema afeta a segurança?**  
R: Não. O arquivo é salvo localmente. O perfil é apenas metadados sobre padrões de linguagem, não conteúdo sensível.

**P: Quantas mensagens o sistema precisa para aprender?**  
R: O sistema começa a mostrar padrões após ~5-10 mensagens, mas melhor com 20+. Máxima confiança geralmente alcançada com 50+ mensagens.

**P: Posso editar o perfil manualmente?**  
R: Sim, editando o arquivo JSON diretamente ou usando `updateWritingProfileField()`.

## Futuras Melhorias

- [ ] Múltiplos contextos (informal vs. formal)
- [ ] Análise de padrões por hora/dia
- [ ] Detecção de mudanças de estilo (switching)
- [ ] Integração com análise semântica
- [ ] Exportação de perfil para compartilhamento
- [ ] Suporte a múltiplos idiomas aprimorado
- [ ] Machine learning para padrões complexos

---

**Desenvolvido para YAMI - Sistema de Assistência e Evolução Inteligente**
