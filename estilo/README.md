# YAMI - Sistema de Análise e Adaptação de Estilo de Escrita

## Visão Geral

O **Sistema de Análise e Adaptação de Estilo de Escrita** (YAMI Estilo) é um módulo avançado que permite ao YAMI compreender e reproduzir o padrão pessoal de comunicação do usuário.

O sistema observa continuamente como o usuário se comunica, constrói um perfil detalhado de seu estilo de escrita e, quando solicitado, é capaz de escrever mensagens, e-mails, respostas automáticas e outros textos que reflitam autenticamente seu padrão pessoal de linguagem.

## Funcionalidades

### 1. **Análise Contínua de Estilo**
O sistema observa os seguintes aspectos da comunicação do usuário:

- **Vocabulário**: uso de linguagem formal, técnica ou casual
- **Grau de formalidade**: nível de formalidade nas comunicações
- **Uso de gírias**: frequência e tipos de gírias/abreviações
- **Estrutura das frases**: comprimento e complexidade das sentenças
- **Tamanho médio das mensagens**: quantidade típica de caracteres por mensagem
- **Frequência de emojis**: padrão de uso de emojis
- **Expressões recorrentes**: frases e padrões comuns
- **Forma de cumprimento**: como o usuário normalmente inicia conversas
- **Forma de encerramento**: como o usuário normalmente encerra conversas
- **Tom emocional predominante**: tom dominante nas comunicações (descontraído, formal, técnico, humorístico, etc.)

### 2. **Perfil Personalizado**
Um perfil estruturado é mantido que captura:

```json
{
  "version": 1,
  "enabled": true,
  "lastUpdated": "ISO datetime",
  "totalMessagesAnalyzed": 0,
  "profile": {
    "vocabulary": { "formal": 0.0, "technical": 0.0, "casual": 0.0 },
    "formality": "casual",
    "slangUsage": "moderado",
    "sentenceStructure": "curto-direto",
    "averageMessageLength": 45,
    "emojiFrequency": "frequente",
    "commonExpressions": ["então", "tipo", "vamos ver"],
    "greeting": "oi",
    "closing": "valeu",
    "primaryTone": "descontraído",
    "secondaryTone": "humorístico",
    "styleTags": ["casual", "descontraído", "humorístico"],
    "description": "Descrição legível do perfil"
  }
}
```

### 3. **Reprodução de Estilo**
Quando solicitado, o YAMI é capaz de:

- **Responder mensagens** no estilo natural do usuário
- **Redigir e-mails** mantendo seu padrão de comunicação
- **Criar textos** que soem autênticos
- **Produzir respostas automáticas** consistentes com seu estilo
- **Elaborar comunicados** com sua voz

### 4. **Aprendizado Contínuo**
O perfil é atualizado gradualmente:

- Cada nova mensagem analisada refina o perfil
- Atualizações usam média móvel ponderada (recency bias)
- O sistema reconhece mudanças de padrão ao longo do tempo
- O aprendizado é incremental e não invasivo

### 5. **Controle do Usuário**
O usuário tem controle total:

- **Ver o perfil atual**: `estilo status`
- **Ver seção para AI**: `estilo view-section`
- **Editar manualmente**: `estilo edit '{"formality": "formal"}'`
- **Redefinir**: `estilo reset`
- **Desativar/Ativar**: `estilo disable` / `estilo enable`
- **Analisar um texto**: `estilo analyze "seu texto aqui"`

## Arquitetura

### Módulos Python

#### `profile.py`
Gerenciamento de dados do perfil:
- `WritingProfile` - Dataclass para o perfil completo
- `StyleProfile` - Dataclass para o perfil de estilo
- `load_profile()` - Carrega o perfil do arquivo JSON
- `save_profile()` - Salva o perfil
- `reset_profile()` - Reseta para padrão

#### `analyzer.py`
Análise de textos para extração de padrões:
- `WritingAnalyzer` - Classe principal de análise
- `analyze()` - Analisa um texto e retorna características
- `update_profile()` - Analisa e atualiza o perfil incrementalmente
- Funções auxiliares para: formalidade, uso técnico, gírias, tom, expressões comuns

#### `prompt.py`
Geração de seções de prompt para o AI:
- `build_style_section()` - Gera seção completa para o prompt
- `build_compact_style_section()` - Versão resumida
- `build_style_instruction_line()` - Instrução em uma linha

#### `cli.py`
Interface de linha de comando para o usuário:
- `cmd_status()` - Mostra status do perfil
- `cmd_view_section()` - Mostra seção para AI
- `cmd_analyze()` - Analisa um texto
- `cmd_update()` - Analisa e atualiza
- `cmd_reset()` - Reseta perfil
- `cmd_enable()` / `cmd_disable()` - Ativa/desativa
- `cmd_edit()` - Edita manualmente
- `main()` - Entry point CLI

### Dados

#### `pendrive/estilo-escrita.json`
Arquivo de armazenamento do perfil de escrita:
- Localizado em `~/.yami/pendrive/estilo-escrita.json`
- Persistido em JSON
- Atualizado após cada análise
- Mantém histórico de últimas 50 amostras analisadas

#### `workspace/USER.md`
Integração com o workspace do OpenClaw:
- Seção "Writing Style" adicionada ao `USER.md`
- Descreve como o AI deve usar o perfil
- Injetada no sistema prompt automaticamente

## Uso

### Como Usuário (Vini)

#### Ver o Perfil Atual
```bash
python -m estilo.cli status
```

Mostra:
- Status (ativado/desativado)
- Número de mensagens analisadas
- Características detectadas
- Descrição do perfil

#### Ver a Seção para o AI
```bash
python -m estilo.cli view-section
```

Mostra exatamente o que o AI vê sobre seu estilo.

#### Analisar um Texto
```bash
python -m estilo.cli analyze "seu texto de exemplo aqui"
```

Mostra características estatísticas do texto:
- Contagem de palavras/caracteres
- Presença de emojis
- Scores de formalidade, técnico, gírias
- Detecção de tom

#### Atualizar Perfil com um Texto
```bash
python -m estilo.cli update "um texto seu para análise"
```

Analisa e atualiza o perfil incrementalmente.

#### Editar Manualmente
```bash
python -m estilo.cli edit '{"formality": "formal", "primaryTone": "profissional"}'
```

#### Redefinir o Perfil
```bash
python -m estilo.cli reset
```

Limpa tudo e começa do zero.

#### Desativar/Ativar
```bash
python -m estilo.cli disable
python -m estilo.cli enable
```

### Como Desenvolvedor

#### Carregar e Usar o Perfil
```python
from estilo.profile import load_profile

profile = load_profile()
print(profile.profile.formality)
print(profile.profile.description)
```

#### Analisar um Texto
```python
from estilo.analyzer import WritingAnalyzer
from estilo.profile import load_profile

profile = load_profile()
analyzer = WritingAnalyzer(profile)
features = analyzer.analyze("seu texto aqui")
print(features)  # Dicionário com características
```

#### Atualizar Perfil
```python
from estilo.analyzer import WritingAnalyzer
from estilo.profile import load_profile, save_profile

profile = load_profile()
analyzer = WritingAnalyzer(profile)
updated = analyzer.update_profile("novo texto para análise")
save_profile(updated)
```

#### Gerar Prompt para AI
```python
from estilo.prompt import build_style_section
from estilo.profile import load_profile

profile = load_profile()
section = build_style_section(profile)
print(section)  # Markdown section for system prompt
```

## Princípios de Design

### ✓ Adaptação Gradual
O perfil é construído incrementalmente, sem mudanças abruptas.

### ✓ Aprendizado Contínuo
Cada interação refina o perfil. Não há limite de análises.

### ✓ Consistência Estilística
O perfil mantém consistência e respeita evolução natural.

### ✓ Personalização
Totalmente customizável. Cada aspecto pode ser editado manualmente.

### ✓ Transparência
O usuário vê exatamente o que o sistema aprendeu.

### ✓ Possibilidade de Ajuste
Redefinir, desativar, ou editar manual a qualquer momento.

## Integração com YAMI

O sistema se integra com YAMI de três formas:

### 1. **Workspace (USER.md)**
O arquivo `USER.md` contém instruções sobre como reproduzir o estilo quando solicitado.

### 2. **Armazenamento (pendrive/)**
O perfil é armazenado em `pendrive/estilo-escrita.json` junto com outros dados de perfil do usuário.

### 3. **AI Context**
Quando o AI é instruído a escrever em nome do usuário, ele referencia este perfil.

## Exemplos Práticos

### Exemplo 1: Responder uma Mensagem de WhatsApp

**Mensagem de contato:**
> "Opa, tudo bem? Como foi o seu dia?"

**Vini pede ao YAMI:**
> "Responde para ele no meu estilo"

**YAMI usa o perfil para escrever algo como:**
(Depende do perfil - poderia ser casual, direto, com expressões comuns, etc.)

### Exemplo 2: Redigir um Email

**Vini:**
> "Redige um email profissional para o meu chefe sobre o projeto X, mas no meu estilo"

**YAMI:**
- Lê o perfil
- Ajusta formalidade ao contexto (email profissional)
- Mantém características do estilo onde apropriado
- Escreve de forma autêntica

### Exemplo 3: Resposta Automática

**Vini:**
> "Cria uma resposta automática para mensagens enquanto estou ausente"

**YAMI:**
- Usa o perfil de escrita
- Mantém o tom e estilo natural
- Cria algo que parece genuinamente vindo do Vini

## Evolução e Futuro

Possibilidades para expansão:

- **Análise de sensibilidade ao contexto**: Adaptar estilo baseado em contexto (profissional vs casual)
- **Detecção de mudanças**: Alertar quando o padrão de escrita muda significativamente
- **Comparação com outros**: Opcionalmente comparar seu estilo com amigos/contatos
- **Sugestões de melhoria**: Oferecer sugestões para tornar a comunicação mais clara
- **Exportação**: Exportar relatório detalhado do perfil
- **Templates**: Salvar templates de mensagens baseados em estilo + contexto

## Troubleshooting

### O perfil não está sendo atualizado
- Verifique se o sistema está habilitado: `estilo status`
- Verifique permissões de arquivo em `pendrive/estilo-escrita.json`
- Use `estilo update "texto"` para atualizar manualmente

### O AI não está usando o estilo
- Certifique-se de que USER.md foi atualizado
- Verifique se o perfil está habilitado
- Peça explicitamente ao YAMI: "Responde no meu estilo"

### Quero editar o perfil manualmente
```bash
python -m estilo.cli edit '{"formality": "formal", "primaryTone": "profissional"}'
```

### Quero resetar tudo
```bash
python -m estilo.cli reset
```

## Contato e Feedback

Para sugestões ou problemas com o sistema de análise de estilo:
1. Use o comando `estilo status` para diagnosticar
2. Edite manualmente conforme necessário
3. Resete se quiser começar do zero

---

**Desenvolvido para YAMI - Seu assistente pessoal inteligente**
