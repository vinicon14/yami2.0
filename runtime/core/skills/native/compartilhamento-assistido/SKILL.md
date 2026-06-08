---
name: compartilhamento-assistido
description: "Compartilhamento assistido nativo — envio de documentos, imagens, áudios e arquivos diversos com confirmação explícita do usuário."
metadata:
  {
    "openclaw":
      {
        "emoji": "📤",
        "os": ["win32", "darwin"],
        "requires": {},
        "native": true,
      },
  }
---

# Compartilhamento Assistido Nativo

Este módulo define as capacidades nativas de compartilhamento assistido do YAMI. Ele gerencia o envio de qualquer tipo de arquivo através dos canais disponíveis, sempre respeitando a confirmação explícita do usuário.

## Princípio Fundamental

**Nada é compartilhado sem confirmação explícita do usuário.**

Este módulo é a camada de segurança que garante que todo compartilhamento passe por verificação humana antes de ser executado.

## Quando Usar

Use quando o usuário pedir para:

- Compartilhar documentos com contatos
- Enviar imagens ou fotos
- Compartilhar áudios ou mensagens de voz
- Enviar arquivos diversos
- Preparar qualquer tipo de mídia para envio
- Confirmar o envio de arquivos

## Quando NÃO Usar

- Sem confirmação explícita do usuário — NUNCA
- Conteúdo que não foi verificado ou aprovado
- Dados sensíveis sem再三 confirmação
- Compartilhamento em massa sem aprovação individual

## Capacidades

### Compartilhar Documentos

Documentos incluem: PDF, DOCX, XLSX, PPTX, TXT, CSV, e outros arquivos de texto/office.

Fluxo:
1. Usuário solicita compartilhamento de documento
2. YAMI localiza o arquivo no sistema
3. YAMI apresenta ao usuário: nome, tipo, tamanho, resumo do conteúdo
4. YAMI pergunta: "Confirmar envio de [arquivo] para [destino]?"
5. Usuário confirma → enviar
6. Usuário recusa → cancelar

Diretório de preparação:
```
~/.yami/media/outgoing/files/
```

### Compartilhar Imagens

Imagens incluem: JPG, JPEG, PNG, GIF, WEBP, BMP.

Fluxo:
1. Usuário solicita compartilhamento de imagem(s)
2. YAMI localiza a(s) imagem(ns) — pode ser por busca contextual
3. YAMI apresenta ao usuário: preview (se possível), nome, data
4. YAMI pergunta: "Confirmar envio de [N] foto(s) para [destino]?"
5. Usuário confirma → copiar para diretório de saída e enviar
6. Usuário recusa → cancelar

Diretório de preparação:
```
~/.yami/media/outgoing/photos/
```

### Compartilhar Áudios

Áudios incluem: MP3, WAV, M4A, OGG, FLAC, e mensagens de voz.

Fluxo:
1. Usuário solicita compartilhamento de áudio
2. YAMI localiza o arquivo de áudio
3. YAMI apresenta: nome, duração, formato
4. YAMI pergunta: "Confirmar envio de [arquivo de áudio] para [destino]?"
5. Usuário confirma → enviar
6. Usuário recusa → cancelar

Diretório de preparação:
```
~/.yami/media/outgoing/audio/
```

### Compartilhar Arquivos Diversos

Arquivos diversos: ZIP, RAR, ISO, executáveis, scripts, etc.

Fluxo:
1. Usuário solicita compartilhamento
2. YAMI localiza o arquivo
3. YAMI apresenta informações e alerta de segurança se necessário
4. YAMI pergunta explicitamente
5. Usuário confirma → enviar
6. Usuário recusa → cancelar

## Integração com Canais

### WhatsApp
Usar WhatsApp upload-file action ou `openclaw message send --channel whatsapp`:
```
openclaw message send --channel whatsapp --target "+5511999999999" --message "Segue arquivo" --media "caminho/do/arquivo"
```

### Email
Usar skill de email configurada ou `himalaya` CLI.

### Outros Canais
- Discord: enviar via `message` tool
- iMessage: enviar via `imsg` com flag `--file`
- Slack: enviar via `slack` skill

## Estrutura de Diretórios

```
~/.yami/media/outgoing/
  ├── photos/    → imagens preparadas para envio
  ├── files/     → documentos preparados para envio
  ├── audio/     → áudios preparados para envio
  └── outros/    → outros arquivos preparados para envio
```

Os diretórios acima servem como zona de staging. Arquivos são copiados para cá durante a preparação e removidos após o envio bem-sucedido ou cancelamento.

## Workflow Padrão

1. **Solicitação**: Usuário pede para compartilhar algo
2. **Identificação**: YAMI localiza e identifica o conteúdo
3. **Apresentação**: YAMI mostra resumo do que será enviado
4. **Confirmação**: YAMI pergunta explicitamente se pode enviar
5. **Execução**: Se confirmado, envia pelo canal apropriado
6. **Relatório**: Informa resultado do envio
7. **Limpeza**: Remove arquivos temporários de staging

## Regras de Segurança

1. **Sempre confirmar** — nenhum arquivo sai sem sim do usuário
2. **Verificar destino** — confirmar para quem está enviando
3. **Verificar conteúdo** — não compartilhar conteúdo que não foi verificado
4. **Não compartilhar dados sensíveis** — senhas, tokens, documentos pessoais sem confirmação rigorosa
5. **Respeitar limites** — não enviar arquivos maiores que o limite do canal (ex: WhatsApp 150MB)
6. **Não enviar para grupos sem permissão** explícita
7. **Sempre confirmar antes de enviar** é a regra mais importante
