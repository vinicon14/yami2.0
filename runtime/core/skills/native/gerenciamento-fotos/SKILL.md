---
name: gerenciamento-fotos
description: "Gerenciamento nativo de fotos — localização, pesquisa contextual, organização de álbuns, busca por data/evento e preparação para compartilhamento."
metadata:
  {
    "openclaw":
      {
        "emoji": "🖼️",
        "os": ["win32", "darwin"],
        "requires": {},
        "native": true,
      },
  }
---

# Gerenciamento de Fotos Nativo

Este módulo define as capacidades nativas de gerenciamento de fotos do YAMI. Ele permite localizar, pesquisar, organizar e preparar imagens de forma inteligente.

## Quando Usar

Use quando o usuário pedir para:

- Encontrar imagens específicas no sistema
- Pesquisar fotos por contexto, descrição ou conteúdo
- Organizar fotos em álbuns temáticos
- Buscar fotos por data ou período
- Buscar fotos por evento ou ocasião
- Preparar fotos para compartilhamento

## Capacidades

### Localizar Imagens

Usar ferramentas do sistema:

```bash
# Windows
exec: Get-ChildItem -Recurse -Include "*.jpg","*.jpeg","*.png","*.gif","*.bmp","*.webp" -Path "C:\Users\vinim\Pictures"

# macOS
exec: find ~/Pictures -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null

# Por data de modificação (últimos 30 dias)
exec: Get-ChildItem -Recurse -Include "*.jpg","*.png" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-30) }
```

Diretórios comuns de busca:
- `~/Pictures`, `~/Fotos`, `~/Imagens`
- `~/Desktop`
- `~/Downloads`
- Google Photos (se autenticado)
- iCloud Photos (macOS)

### Pesquisar Fotos por Contexto

Para fotos que o modelo pode "ver" (via ferramentas de visão):

1. Localizar fotos candidatas no período/área relevante
2. Examinar o conteúdo visual das fotos
3. Identificar quais correspondem ao contexto solicitado
4. Apresentar resultados ao usuário

Para fotos sem acesso visual direto:
- Usar metadados EXIF (data, localização, câmera)
- Usar nomes de arquivo e diretórios
- Usar datas de modificação

### Organizar Álbuns

Criar álbuns organizados:

```json
{
  "nome": "Viagem Rio 2026",
  "descricao": "Fotos da viagem ao Rio de Janeiro em janeiro 2026",
  "capa": "caminho/para/foto-capa.jpg",
  "fotos": ["caminho/foto1.jpg", "caminho/foto2.jpg"],
  "dataCriacao": "2026-06-08",
  "evento": "Viagem Rio",
  "tags": ["viagem", "rio", "ferias"]
}
```

Álbuns podem ser:
- **Automáticos**: baseados em eventos detectados (datas próximas, localização similar)
- **Manuais**: criados pelo usuário via comando
- **Temporários**: para preparação de compartilhamento

### Encontrar por Data

```bash
# Fotos de uma data específica
exec: Get-ChildItem -Recurse -Include "*.jpg","*.png" | Where-Object { $_.LastWriteTime.Date -eq (Get-Date "2026-01-15").Date }

# Fotos de um mês/ano
exec: Get-ChildItem -Recurse -Include "*.jpg","*.png" | Where-Object { $_.LastWriteTime.Year -eq 2026 -and $_.LastWriteTime.Month -eq 1 }

# Fotos de um período
exec: Get-ChildItem -Recurse -Include "*.jpg","*.png" | Where-Object { $_.LastWriteTime -ge (Get-Date "2025-12-01") -and $_.LastWriteTime -le (Get-Date "2026-02-28") }
```

### Encontrar por Evento

Identificar eventos a partir de:
- **Datas agrupadas**: fotos tiradas em sequência em dias próximos
- **Localização EXIF**: coordenadas GPS nos metadados
- **Nome de diretórios**: pastas como `Viagem_RIO_2026`
- **Contexto informado**: "fotos do aniversário do ano passado"

### Preparar Fotos para Compartilhamento

Ao preparar fotos para enviar:

1. Confirmar com o usuário quais fotos enviar
2. Copiar para diretório de saída:
   - `~/.yami/media/outgoing/photos/` (ou conforme TOOLS.md)
3. Redimensionar se necessário (arquivos muito grandes)
4. Usar canal apropriado para envio:
   - WhatsApp: usar WhatsApp upload-file action
   - Email: anexar à mensagem
5. Confirmar antes de enviar

## Workflow Padrão

1. Usuário pede para encontrar/enviar foto(s)
2. Identificar critérios (contexto, data, evento, local)
3. Executar busca no sistema de arquivos
4. Se busca visual necessária, examinar candidatas
5. Apresentar resultados ao usuário
6. Se compartilhamento, preparar e confirmar

## Armazenamento

Catálogo local: `~/.yami/fotos/`
- `indice.json` — índice de fotos conhecidas com metadados
- `albuns.json` — definição de álbuns
- `tags.json` — sistema de tags

## Observações

- Fotos do Google Photos autenticado são consideradas aprovadas para compartilhamento quando o contato pedir explicitamente
- Respeitar as políticas de compartilhamento definidas em USER.md e TOOLS.md
- Fotos com conteúdo sensível não devem ser compartilhadas sem confirmação rigorosa
