---
name: gerenciamento-arquivos
description: "Gerenciamento nativo de arquivos — localização, organização, identificação de conteúdo, agrupamento, preparação para compartilhamento e buscas contextuais."
metadata:
  {
    "openclaw":
      {
        "emoji": "📁",
        "os": ["win32", "darwin"],
        "requires": {},
        "native": true,
      },
  }
---

# Gerenciamento de Arquivos Nativo

Este módulo define as capacidades nativas de gerenciamento de arquivos do YAMI. Ele permite localizar, organizar, analisar e preparar documentos de forma inteligente.

## Quando Usar

Use quando o usuário pedir para:

- Encontrar arquivos específicos no sistema
- Organizar documentos por tipo, data, projeto ou assunto
- Identificar o conteúdo relevante em arquivos
- Agrupar informações relacionadas
- Preparar arquivos para compartilhamento
- Realizar buscas contextuais (não apenas por nome)

## Capacidades

### Localizar Arquivos

Usar ferramentas do sistema para busca:

```bash
# Por nome (qualquer SO)
exec: find / -name "*.pdf" 2>/dev/null (Linux/macOS)
exec: Get-ChildItem -Recurse -Filter "*.pdf" (Windows/PowerShell)

# Por tipo
exec: Get-ChildItem -Recurse -Include "*.docx","*.xlsx" (Windows)

# Por data de modificação
exec: Get-ChildItem -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }

# Combinado
exec: Get-ChildItem -Path "C:\Users" -Recurse -Filter "relatorio*" -ErrorAction SilentlyContinue
```

Para buscas mais rápidas e contextuais, manter um índice local em:
```
~/.yami/arquivos/indice.json
```
O índice pode ser construído incrementalmente conforme arquivos são acessados.

### Organizar Documentos

Estratégias de organização automática:

1. **Por tipo**: Agrupar por extensão (.pdf, .docx, .xlsx, etc.)
2. **Por projeto**: Identificar arquivos relacionados a um mesmo projeto ou assunto
3. **Por data**: Organizar cronologicamente
4. **Por tags**: Atribuir tags com base no conteúdo

Estrutura de organização sugerida:
```
~/.yami/arquivos/organizados/
  ├── documentos/
  ├── planilhas/
  ├── apresentacoes/
  ├── imagens/
  ├── audios/
  └── projetos/
```

### Identificar Conteúdos Relevantes

Para entender o conteúdo de arquivos:

1. Arquivos de texto: ler diretamente e extrair resumo
2. PDFs: extrair texto com ferramentas como `pdftotext` ou ler como texto
3. Documentos Office: ler com ferramentas apropriadas
4. Imagens: usar capacidades de visão do modelo

Manter metadados de conteúdo identificado:
```json
{
  "caminho": "C:/Users/vinim/Documents/relatorio.pdf",
  "tipo": "documento",
  "resumo": "Relatório financeiro Q1 2026",
  "palavrasChave": ["financeiro", "Q1", "2026", "receita"],
  "dataIdentificacao": "2026-06-08T15:00:00Z"
}
```

### Agrupar Informações

Técnicas de agrupamento:

- **Por similaridade de conteúdo**: arquivos com palavras-chave comuns
- **Por período temporal**: arquivos criados/modificados no mesmo período
- **Por fluxo de trabalho**: arquivos usados juntos em tarefas
- **Por projeto**: arquivos relacionados a um mesmo projeto

### Preparar para Compartilhamento

Ao preparar arquivos para compartilhar:

1. Verificar se o arquivo existe e é acessível
2. Confirmar com o usuário qual arquivo enviar
3. Copiar para diretório de saída:
   - Documentos: `~/.yami/arquivos/compartilhar/`
   - Fotos: diretório de mídia configurado
4. Usar canal apropriado para o envio

### Buscas Contextuais

Buscar além do nome do arquivo:

- Por conteúdo textual dentro de documentos
- Por data aproximada ("arquivos da semana passada")
- Por assunto ou tema ("documentos sobre o projeto X")
- Por tipo combinado com período ("planilhas financeiras de 2025")
- Por palavras-chave no conteúdo

## Workflow Padrão

1. Usuário faz solicitação sobre arquivo(s)
2. Identificar escopo da busca (local, tipo, período)
3. Executar busca apropriada
4. Apresentar resultados organizados
5. Se ação necessária (compartilhar, organizar), confirmar antes

## Armazenamento

Índice e metadados: `~/.yami/arquivos/`
- `indice.json` — índice de arquivos conhecidos
- `conteudos.json` — resumos e palavras-chave de conteúdo
- `tags.json` — sistema de tags atribuídas
- `organizados/` — cópia organizada quando solicitado

## Segurança

- Não acessar arquivos de sistema sem necessidade
- Respeitar permissões de arquivo existentes
- Confirmar antes de mover, copiar ou excluir arquivos
- Não compartilhar arquivos sem permissão explícita do usuário
