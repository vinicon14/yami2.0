# Learning Engine - Guia Rápido

## O que é?

Um sistema que aprende seus hábitos e oferece sugestões personalizadas sem limitar sua liberdade de ação.

## Onde os dados ficam?

Tudo está em: `~/.yami/learning-engine/profile.json`

Você pode ler este arquivo a qualquer momento para ver o que foi aprendido.

## O que está sendo rastreado?

| O quê | Por quê | Nível de Confiança |
|-------|--------|-------------------|
| Horários de uso | Reconhecer quando você está ativo | Incrementa com repetição |
| Comandos frequentes | Oferecer atalhos | Incrementa com uso |
| Aplicativos usados | Sugerir apps relevantes | Incrementa com uso |
| Formato preferido (PDF, slides, etc) | Sugerir formato padrão | Incrementa com padrão repetido |
| Rotinas por período (manhã/tarde/noite) | Antecipar ações típicas | Incrementa a cada dia |
| Fluxos de trabalho | Oferecer automação | Após 2+ repetições |

## Como funciona?

### Aprendizado
```
Você faz algo → YAMI registra → Padrão detectado → Oferecida sugestão
```

### Confiança
- 0-30%: Padrão muito fraco, ignorado
- 30-50%: Padrão em formação, sugestão baixa confiança
- 50-80%: Padrão estabelecido, boa sugestão
- 80%+: Padrão muito forte, sugestão alta confiança

### Contexto
Se você **sempre** pede PDF, mas **hoje** pede slides:
- ✅ YAMI reconhece mudança de contexto
- ✅ YAMI não insiste em PDF
- ✅ YAMI respeita seu novo pedido
- ✅ YAMI aprende que às vezes você quer slides

## Exemplos Reais

### Exemplo 1: Formato de Saída

**Dia 1-5:** Você pede "cria um relatório" e sempre escolhe PDF
```
Perfil: outputFormat = pdf (confiança: 20% → 40% → 60% → 80%)
```

**Dia 6:** Você pede "cria um relatório"
```
YAMI: "Quer em PDF como de costume?" 
(sugestão, mas não obrigado)
```

**Dia 7:** Você pede "cria uma apresentação"
```
YAMI: Entende novo contexto, NÃO sugere PDF
Oferece: PowerPoint/Slides como padrão
```

### Exemplo 2: Rotina Matinal

**Padrão detectado:**
- De segunda a sexta, 08:00-09:00
- Você sempre pede "notícias", depois "clima", depois "abrir email"

**YAMI oferece:**
```
"Bom dia! Quer as notícias de hoje + clima como de costume?"
```

**Se você disser não:**
- Respeita sua exceção
- Não insiste

### Exemplo 3: Fluxo de Trabalho

**Você faz 3x:**
1. Abre planilha
2. Exporta para CSV
3. Envia por email

**YAMI detecta:**
```json
{
  "name": "exportar dados",
  "steps": ["abrir planilha", "exportar CSV", "enviar email"],
  "frequency": 3
}
```

**YAMI oferece:**
```
"Detectei um padrão: você sempre exporta dados e envia. 
Quer que eu faça tudo de uma vez?"
```

## Regras Importantes

### ✅ YAMI FAZ:
- Aprende padrões
- Oferece sugestões baseadas em hábitos
- Respeita mudanças de contexto
- Adapta-se a novo comportamento
- Confirma ações importantes

### ❌ YAMI NÃO FAZ:
- Força padrão aprendido
- Deleta/modifica sem confirmar
- Assume que você quer sempre a mesma coisa
- Executa ações perigosas cegamente
- Limita suas opções

## Como Usar

### Ler o Perfil
```bash
cat ~/.yami/learning-engine/profile.json
```

### Editar o Perfil (avançado)
Você pode editar direto o JSON se quiser resetar algo:
- Abra `~/.yami/learning-engine/profile.json`
- Reduza `confidence` para 0 para resetar preferência
- Delete linha para esquecer padrão
- Salve e YAMI carregará mudanças

### Resetar Tudo
```bash
rm ~/.yami/learning-engine/profile.json
```
(Será recriado na próxima execução)

## Perguntas Frequentes

**P: YAMI esquece o que aprendi se eu desligar?**
A: Não. Tudo é salvo em `profile.json`. Mesmo desligando, padrões persistem.

**P: Posso deletar meu perfil?**
A: Sim. Delete `profile.json` e será recriado vazio na próxima execução.

**P: YAMI grava senhas ou dados sensíveis?**
A: Não. Grava apenas ações/padrões, nunca conteúdo sensível.

**P: Como YAMI esqueça de algo?**
A: Padrões muito antigos (30+ dias sem uso) são automaticamente desconsiderados.

**P: Isso viola minha privacidade?**
A: Não. Tudo fica local em seu computador, em `~/.yami/learning-engine/`.
Nada é enviado para servidor.

**P: Posso compartilhar meu perfil?**
A: Pode compartilhar o arquivo `profile.json` como um backup ou para transferir entre máquinas.

## Desenvolvimento

Se você é desenvolvedor integrado com YAMI:

```javascript
import { getInstance } from '~/.yami/learning-engine/index.mjs';

const engine = getInstance();

// Registrar atividade
engine.recordInteraction('command', userRequest);

// Obter sugestões
const suggestions = engine.getSuggestions(userRequest);

// Ver contexto atual
const context = engine.getContextSummary(userRequest);

// Decidir se confirmar
if (engine.shouldConfirmAction(userRequest) === 'high') {
  // Pedir confirmação
}
```

## Status

✅ Sistema totalmente implementado e funcionando
✅ Dados persistindo corretamente
✅ Aprendizado ativo em `profile.json`
✅ Sugestões adaptativas funcionais
✅ Zero impacto na performance do YAMI

---

**Última atualização:** 2026-06-08
**Versão:** 1.0
