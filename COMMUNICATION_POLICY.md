# Regra 2: Política de Comunicação Padrão Baseada em Texto

## Visão Geral

O YAMI implementa uma política de comunicação padrão baseada em texto para todas as plataformas conectadas. Esta é uma regra fundamental que garante:

- **Controle do usuário**: O usuário tem controle total sobre o formato de comunicação
- **Previsibilidade**: O sistema sempre prioriza texto, nunca assume outros formatos
- **Simplicidade**: Menos fricção, menos surpresas
- **Consistência**: Mesmo comportamento em todas as plataformas

## Regra Principal

**Texto é o formato padrão de comunicação.**

Independentemente da plataforma utilizada, o YAMI deve sempre priorizar mensagens de texto, salvo quando o usuário solicitar explicitamente outro formato.

## Plataformas Abrangidas

A política se aplica a:

- **WhatsApp**
- **Telegram**
- **Discord**
- **E-mail**
- **SMS**
- **Mensagens internas do YAMI**
- **Redes sociais integradas**
- **Futuras integrações**

## Princípios Obrigatórios

### 1. Simplicidade
- Não complique com múltiplas opções
- Texto é sempre a primeira escolha
- Usuário solicita explicitamente se quer algo diferente

### 2. Clareza
- Deixe claro o que está sendo enviado
- Confirme o formato quando não for texto
- Comunique as limitações de cada plataforma

### 3. Previsibilidade
- Comportamento consistente em todas as plataformas
- O usuário sabe exatamente o que esperar
- Sem conversões automáticas ou "atalhos inteligentes"

### 4. Controle do Usuário
- O usuário decide o formato final
- O YAMI nunca assume ou presume
- Sempre pede permissão antes de formatos não-texto

### 5. Consistência Entre Plataformas
- Mesmas regras para WhatsApp, Telegram, Discord, etc.
- Mesmo comportamento independente do canal
- Sem exceções ad-hoc por plataforma

### 6. Baixa Fricção
- Simples para o usuário usar
- Poucos cliques ou comandos
- Sem complicações desnecessárias

## Regra Obrigatória

O YAMI **não deve assumir automaticamente** que deve enviar:

- 🎵 **Áudios**
- 🎬 **Vídeos**
- 🖼️ **Imagens**
- 📄 **Documentos**
- 📦 **Arquivos**

Esses formatos **só devem ser utilizados quando houver solicitação explícita** do usuário ou quando forem **claramente necessários para cumprir a tarefa**.

## Exemplos de Uso

### ✅ Correto

```
Usuário: "Envie uma mensagem para João avisando que chegarei às 18h."
YAMI: Envia mensagem de texto para João
```

```
Usuário: "Diga ao grupo que a reunião é amanhã às 10h."
YAMI: Envia mensagem de texto para o grupo
```

```
Usuário: "Envie isso como áudio."
YAMI: Converte para áudio e envia
```

```
Usuário: "Transforme isso em vídeo."
YAMI: Cria vídeo e envia
```

### ❌ Incorreto

```
Usuário: "Envie uma mensagem para João avisando que chegarei às 18h."
YAMI: Converte automaticamente em áudio e envia ❌
```

```
Usuário: "Mande uma foto para o grupo."
YAMI: Envia sem confirmar qual foto ❌
```

```
Usuário: "Envie essa informação."
YAMI: Automaticamente cria documento e envia ❌
```

## Comandos do Usuário

O usuário pode solicitar formatos diferentes usando:

### Português

| Comando | Significado |
|---------|-------------|
| "Envie isso como áudio." | Converter para áudio |
| "Transforme isso em vídeo." | Converter para vídeo |
| "Envie como imagem." | Converter para imagem |
| "Envie como documento." | Converter para documento |
| "Anexe a imagem." | Anexar como arquivo |
| "Envie como texto." | Manter como texto (padrão) |

### English

| Command | Meaning |
|---------|---------|
| "Send this as audio." | Convert to audio |
| "Turn this into a video." | Convert to video |
| "Send as image." | Convert to image |
| "Send as document." | Convert to document |
| "Attach the image." | Attach as file |
| "Send as text." | Keep as text (default) |

## Fluxo de Confirmação

Quando o usuário pedir um formato não-texto:

```
1. Usuário solicita formato específico
   "Envie como áudio."

2. YAMI confirma
   "Devo enviar esta mensagem como áudio para João?"

3. Se confirmado, executa
   ✅ Envia áudio

4. Se negado
   ❌ Não envia, pergunta o que fazer
```

## Configuração Técnica

A política está definida em `yami.json` sob:

```json
{
  "yami": {
    "rules": {
      "textDefault": true,
      "explicitFileShareOnly": true,
      "communicationPolicy": {
        "version": "2.0",
        "mandate": "Texto é o formato padrão de comunicação",
        "platforms": {
          "whatsapp": { "defaultFormat": "text" },
          "telegram": { "defaultFormat": "text" },
          "discord": { "defaultFormat": "text" },
          "email": { "defaultFormat": "text" },
          "sms": { "defaultFormat": "text" },
          "internal": { "defaultFormat": "text" }
        }
      }
    }
  }
}
```

## Para o Agent (Sistema Prompt)

O agente deve estar ciente desta política ao processar comandos:

### Sistema Prompt - Communication Policy Block

```
COMUNICAÇÃO - POLÍTICA OBRIGATÓRIA (Regra 2):

Texto é o formato padrão para todas as comunicações.

Quando o usuário pedir para:
- Responder alguém
- Enviar uma mensagem
- Iniciar uma conversa

O formato padrão DEVE ser TEXTO.

NUNCA assuma automaticamente que deve enviar:
- Áudios
- Vídeos
- Imagens
- Documentos
- Arquivos

Esses formatos SÓ são usados com solicitação EXPLÍCITA do usuário.

Exemplos de solicitação explícita:
- "Envie como áudio"
- "Transforme em vídeo"
- "Envie como documento"
- "Anexe a imagem"

Sem uma solicitação explícita: SEMPRE use TEXTO.
```

## Implementação

Esta política é implementada através de:

1. **Configuração em `yami.json`**
   - Definição da política
   - Regras por plataforma
   - Comandos permitidos

2. **Sistema Prompt do Agente**
   - Instrução clara: texto é o padrão
   - Exemplos do que fazer/não fazer
   - Fluxo de confirmação obrigatório

3. **Guardrails no Runtime**
   - Validação antes de enviar não-texto
   - Confirmação com usuário
   - Logging de decisões

4. **Documentação**
   - Este arquivo
   - README.md do projeto
   - Exemplos na interface

## Evolução Futura

- Todas as futuras integrações **herdam automaticamente** esta política
- Não há exceções por plataforma - a política é universal
- O usuário sempre tem controle através de comandos explícitos

## Palavras-chave (Tags)

```
#ComunicaçãoTexto #TextoDefault #ControlDoUsuário #Previsibilidade 
#RegraDois #Policy #WhatsApp #Telegram #Discord #Email #SMS
#PoliticaDeComunicação #FormatoTexto #Simplicidade #Clareza
```

---

**Efetivo desde:** 2026-06-08  
**Versão:** 2.0  
**Status:** Implementado
