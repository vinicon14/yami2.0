# Checklist: Paridade de Funcionalidades

Use este checklist para **CADA** nova funcionalidade antes de fazer commit.

---

## Informações da Funcionalidade

**Nome da Funcionalidade**: ________________________  
**Data**: ________________________  
**Desenvolvedor(a)**: ________________________  
**PR/Issue**: ________________________  

---

## 1. Definição e Escopo

- [ ] Funcionalidade está claramente definida
- [ ] Caso de uso principal está documentado
- [ ] Não é apenas um "nice to have" visual
- [ ] Representa uma ação concreta do sistema

**Descrição**: 
```
(Descrever em 2-3 frases o que a funcionalidade faz)
```

---

## 2. Interface de Chat

- [ ] Comando ou ação está implementada
- [ ] Segue padrão `/comando parametro`
- [ ] Funcionalidade está testada em chat
- [ ] Resposta é clara e informativa
- [ ] Erros são tratados com mensagem adequada

**Exemplos de Uso**:
```
/exemplo parametro1 parametro2
/exemplo --flag value
```

**Teste Manual**:
- [ ] Executado com sucesso
- [ ] Mensagem de confirmação recebida
- [ ] Resultado visível no chat

---

## 3. Interface de Voz

### 3.1 Reconhecimento de Intenção

- [ ] Padrões naturais de fala definidos
- [ ] Mapeamento de parâmetros configurado
- [ ] Suporta variações de linguagem (formal/informal)
- [ ] Trata pronúncia aproximada

**Padrões Definidos**:
```
"[frase em português natural]"
"[variação 1]"
"[variação 2]"
```

### 3.2 Execução em Voz

- [ ] Ferramenta executável via voice dispatcher
- [ ] Parâmetros são extraídos corretamente
- [ ] Contexto de áudio é preservado
- [ ] Não há bloqueios durante execução

**Teste Manual**:
- [ ] "Ative voice mode"
- [ ] Diga um dos padrões naturalmente
- [ ] Funcionalidade executou
- [ ] Feedback de áudio recebido

### 3.3 Resposta em Voz

- [ ] TTS fornece feedback claro
- [ ] Mensagem é concisa (< 15s de áudio)
- [ ] Erros são descritos audívelmente
- [ ] Não contém caracteres especiais não-pronunciáveis

**Exemplo de Resposta**:
```
"[O que YAMI vai dizer em áudio]"
(máx 15 segundos)
```

---

## 4. Equivalência Funcional

### 4.1 Parâmetros

| Parâmetro | Chat | Voz | Equivalente? |
|-----------|------|-----|------------|
| param1 | `/cmd --p1=val` | "com param um igual a valor" | ☐ Sim |
| param2 | `/cmd --p2=val` | "e param dois é valor" | ☐ Sim |
| opconal | (opcional) | (se aplicável) | ☐ Sim |

### 4.2 Resultado

- [ ] Chat e voz produzem o mesmo resultado
- [ ] Dados salvos são idênticos
- [ ] Estado do sistema é equivalente
- [ ] Side effects são os mesmos

**Teste de Equivalência**:
```
1. Executar via chat: /comando param
2. Executar via voz: "frase natural"
3. Comparar resultados
4. ✅ Deve ser idêntico
```

---

## 5. Tratamento de Erros

### 5.1 Erros Esperados

| Cenário | Chat | Voz | Parity? |
|---------|------|-----|---------|
| Parâmetro inválido | "X não é válido" | "X não é válido" | ☐ |
| Permissão negada | "Acesso negado" | "Acesso negado" | ☐ |
| Recurso não encontrado | "Não encontrado" | "Não encontrado" | ☐ |
| Erro no sistema | "Erro ao executar" | "Erro ao executar" | ☐ |

### 5.2 Casos Limite

- [ ] Parâmetros vazio/nulo tratados
- [ ] Timeout tratado em ambas
- [ ] Rede indisponível tratada
- [ ] Mensagens de erro são úteis

---

## 6. Performance e Bloqueios

- [ ] Operação completa em < 5 segundos (ideal)
- [ ] Se tomar mais: fornece feedback imediato
- [ ] Não bloqueia outros comandos de voz
- [ ] Background job (se necessário) está implementado

**Se operação é longa (> 5s)**:
- [ ] Confirmação imediata fornecida ("começando...")
- [ ] Status pode ser consultado ("qual é o status?")
- [ ] Notificação quando completa
- [ ] YAMI continua recebendo novos comandos

---

## 7. Testes

### 7.1 Testes de Chat

```typescript
describe('FunçãoX - Chat', () => {
  it('executa com sucesso', () => { /* ✅ */ });
  it('trata erro corretamente', () => { /* ✅ */ });
  it('valida parâmetros', () => { /* ✅ */ });
});
```

- [ ] Teste de sucesso existe
- [ ] Teste de erro existe
- [ ] Teste de validação existe
- [ ] Cobertura > 80%

### 7.2 Testes de Voz

```typescript
describe('FunçãoX - Voice', () => {
  it('reconhece intent', () => { /* ✅ */ });
  it('extrai parâmetros', () => { /* ✅ */ });
  it('executa corretamente', () => { /* ✅ */ });
});
```

- [ ] Teste de intent recognition existe
- [ ] Teste de parameter extraction existe
- [ ] Teste de execução existe
- [ ] Cobertura > 80%

### 7.3 Teste de Paridade

```typescript
describe('FunçãoX - Parity', () => {
  it('chat e voz produzem mesmo resultado', () => {
    const chatResult = executarViaChat(...);
    const voiceResult = executarViaVoz(...);
    expect(chatResult).toEqual(voiceResult); ✅
  });
});
```

- [ ] Teste de paridade existe
- [ ] Testa resultado idêntico
- [ ] Testa tratamento de erro idêntico

---

## 8. Documentação

### 8.1 Inline Documentation

- [ ] Função/método tem JSDoc/comentários
- [ ] Parâmetros estão documentados
- [ ] Retorno está documentado
- [ ] Exemplos de uso inclusos

### 8.2 Skill Documentation (SKILL.md)

- [ ] SKILL.md foi criado/atualizado
- [ ] Descrição clara da funcionalidade
- [ ] Exemplo de uso em chat
- [ ] Exemplo de uso em voz
- [ ] Seção "Paridade" indicando status

**Template Mínimo**:
```markdown
## FunçãoX

Descrição: [...]

### Chat
\`/comando parametro\`

### Voz  
"Frase natural"

### Status de Paridade
- ✅ Chat: Implementado
- ✅ Voz: Implementado
- Status: **COMPLETO**
```

### 8.3 Changelog Entry

- [ ] CHANGELOG.md foi atualizado
- [ ] Menciona suporte em chat E voz
- [ ] Versão/data está correta

**Exemplo**:
```markdown
### Adicionado
- ✅ Funcionalidade X com suporte completo: Chat + Voz
```

---

## 9. Metadados de Paridade

### 9.1 CommandEntry

```typescript
export const comando: CommandEntry = {
  // ... implementação
  parity: {
    status: 'full',              // ✅ full / ⚠️ partial / ❌ chat_only / ❌ voice_only
    testedOn: ['chat', 'voice'], // ✅ Ambas
    equivalence: 'functional',   // ✅ functional / ⚠️ resultative
  },
};
```

- [ ] `parity.status` está preenchido
- [ ] `parity.testedOn` inclui ambas
- [ ] `parity.equivalence` está declarado

### 9.2 Tool

```typescript
export const tool: Tool = {
  // ... implementação
  parity: {
    supportedIn: ['chat', 'voice'], // ✅ Ambas
    status: 'full',                 // ✅ full
  },
};
```

- [ ] `parity.supportedIn` inclui 'chat'
- [ ] `parity.supportedIn` inclui 'voice'
- [ ] `parity.status` está preenchido

---

## 10. Revisão Final

### Autoverificação

- [ ] Funcionalidade funciona em chat
- [ ] Funcionalidade funciona em voz
- [ ] Ambas produzem resultado idêntico
- [ ] Erros tratados igual
- [ ] Testes de paridade passam
- [ ] Documentação está completa
- [ ] Metadados corretos

### Verificação Automatizada

Antes de commit:
```bash
git add .
npm run validate:parity      # ✅ Deve passar
npm run test:parity          # ✅ Deve passar 100%
```

### Code Review Checklist

Para o revisor:

- [ ] Funcionalidade tem suporte de voz documentado
- [ ] Testes de paridade existem
- [ ] Sem exceções de paridade não autorizadas
- [ ] PARITY_RULE.md foi respeitada
- [ ] Metadata está correto

---

## 11. Casos Especiais

### Se Paridade Limitada / Parcial

Somente com **aprovação explícita** do tech lead:

```markdown
[PARITY LIMITATION APPROVED]

Funcionalidade: [X]
Limitação: [descrição]
Motivo: [justificativa técnica]
Aprovado por: [tech lead]
Data de Expiração: [data máximo de 1 release]

Plano de Remediação: [como completar paridade depois]
```

- [ ] Aprovação documentada
- [ ] Data de expiração definida
- [ ] Plano de remediação existe
- [ ] Issue de paridade aberta

---

## 12. Signature

**Checklist preenchido por**: ________________________  
**Data**: ________________________  
**Assinado**: ☐  

---

## 13. Observações Adicionais

```
(Espaço para notas sobre o desenvolvimento, decisões, etc.)




```

---

**Próximo Passo**: Fazer commit com este checklist preenchido
```bash
git add FEATURE_PARITY_CHECKLIST.md
git commit -m "Feat: [Nome da Funcionalidade] - Chat + Voice Parity ✅"
```

---

**Referências**:
- [PARITY_RULE.md](./PARITY_RULE.md) - Regra oficial
- [PARITY_IMPLEMENTATION_GUIDE.md](./PARITY_IMPLEMENTATION_GUIDE.md) - Guia técnico
