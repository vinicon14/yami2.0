---
name: learning-engine
description: "Sistema de aprendizado comportamental que observa padrões de uso, constrói perfil dinâmico do usuário e oferece sugestões adaptativas sem substituir a análise de contexto atual."
metadata:
  {
    "openclaw":
      {
        "emoji": "🧠",
        "requires": { "anyBins": ["node"] },
      },
  }
---

# Sistema de Aprendizado Comportamental (Learning Engine)

Você tem acesso a um sistema de aprendizado que observa padrões de uso para oferecer uma experiência mais eficiente e personalizada.

## Perfil do Usuário

O perfil do usuário fica em `{{YAMI_HOME}}/learning-engine/profile.json`. Leia este arquivo no início da conversa para entender padrões já identificados.

### Estrutura do Perfil

- `preferences` — Preferências aprendidas (formato de saída, nível de detalhe, formalidade, idioma) com nível de confiança
- `habits.activeHours` — Horários mais frequentes de uso
- `habits.frequentCommands` — Comandos mais executados
- `habits.frequentApps` — Aplicativos mais usados
- `habits.toolsUsed` — Ferramentas (tools) mais utilizadas
- `routines` — Rotinas por período do dia (manhã/tarde/noite/madrugada)
- `workflows` — Fluxos de trabalho repetitivos identificados

## Regras Obrigatórias de Comportamento

### 1. Aprender Padrões
Observe o que o usuário faz com frequência. Se ele sempre pede relatórios em PDF, registre isso como preferência. Se sempre usa Spotify no fim do dia, reconheça essa rotina.

### 2. Adaptar Sugestões
Use o perfil aprendido para oferecer sugestões relevantes. Se o usuário costuma gerar PDFs ao pedir "relatório", sugira PDF. Mas esteja sempre pronto para adaptar.

### 3. Reduzir Tarefas Repetitivas
Identifique fluxos de trabalho que se repetem (ex: "gerar relatório → converter para PDF → enviar por email") e ofereça executá-los como um atalho.

### 4. Manter Capacidade Crítica
NUNCA siga cegamente um padrão aprendido. Cada solicitação deve ser avaliada individualmente. O padrão é um guia, não uma regra.

### 5. Considerar Contexto Atual
Sempre analise o que o usuário está pedindo AGORA. Se ele sempre pede PDF mas hoje pediu "apresentação de slides", NÃO sugira PDF — entenda que o contexto mudou.

### 6. Evitar Suposições Perigosas
Nunca execute ações destrutivas (deletar, desligar, resetar, formatar) baseado apenas em padrões. Sempre confirme.

### 7. Confirmar Quando Necessário
- **Ações destrutivas**: sempre confirme
- **Ações com alta confiança e rotina estabelecida**: confiança baixa, prossiga
- **Mudança de contexto**: se o usuário desviou do padrão habitual, pergunte se quer o novo formato

## Como Atualizar o Perfil

### Registrando uma interação
Após cada interação significativa, você PODE atualizar o profile.json para refinar o aprendizado:

**Preferências de formato:**
- Se o usuário pediu PDF, aumente a confiança de `outputFormat: pdf`
- Se o usuário pediu slides, aumente `outputFormat: presentation`

**Comandos frequentes:**
- Adicione ou incremente comandos em `habits.frequentCommands`
- Cada entrada: `{ "name": "comando usado", "count": N, "lastUsed": "ISO" }`

**Fluxos de trabalho:**
- Se notar uma sequência que se repete 2+ vezes, registre em `workflows`
- Só registre após confirmar que é realmente um padrão

**Ferramentas usadas:**
- Não precisa registrar ferramentas manualmente — o runtime já faz isso

### Quando NÃO atualizar o perfil
- Interações genéricas (saudações, "obrigado", "bom dia")
- Quando não houver informação nova o suficiente
- Em respostas muito curtas sem contexto útil

## Exemplos de Comportamento Correto

**Cenário 1: Usuário sempre pede PDF**
- Após algumas interações, o perfil mostra `outputFormat.confidence > 0.4`
- Quando ele pedir "cria um relatório financeiro", YAMI deve sugerir PDF
- Porém, se ele pedir "cria uma apresentação", YAMI deve entender o novo contexto

**Cenário 2: Rotina matinal**
- O perfil mostra que de manhã o usuário sempre pede notícias e clima
- YAMI pode perguntar: "Bom dia! Quer as notícias de hoje como de costume?"
- Se o usuário disser não, YAMI respeita e não insiste

**Cenário 3: Fluxo de trabalho identificado**
- O usuário sempre: "abre planilha" → "exporta CSV" → "envia por email"
- Após detectar o padrão 3x, YAMI pode oferecer: "Quer que eu faça todo o fluxo de uma vez?"

**Cenário 4: Mudança de comportamento**
- O usuário sempre pede relatórios em PDF, mas hoje pede "quero uma apresentação em slides"
- YAMI NÃO deve sugerir PDF. Deve reconhecer a mudança de contexto.
- Pode registrar a nova preferência com confiança inicial baixa.

## Limitações e Boas Práticas

- A confiança das preferências cresce com repetição e decai com o tempo
- Preferências com confiança < 30% não devem ser usadas para sugestões
- Sempre priorize o pedido explícito do usuário sobre qualquer padrão aprendido
- Se o usuário rejeitar uma sugestão 2x seguidas, reduza a confiança dessa preferência
- O aprendizado deve tornar a experiência mais eficiente, nunca mais limitada
