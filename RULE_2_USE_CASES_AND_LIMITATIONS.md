# Regra 2 - Casos de Uso e Limitações

## 📚 Casos de Uso Suportados

### Caso 1: Envio de Foto para Contato

```
Usuário: "Envie a foto da reunião para Maria"

Sistema:
  1. Detecta: send_message com "MEDIA:/path/photo.jpg"
  2. Bloqueia: Retorna mensagem de erro
  3. Modelo recebe bloqueio
  4. Modelo pergunta: "Você quer enviar a foto para Maria?"
  5. Usuário: "Sim"
  6. Modelo tenta novamente
  7. (Loop até haver confirmação explícita)

Resultado: ✅ Arquivo não é enviado sem confirmação
```

### Caso 2: Compartilhamento de Documento Importante

```
Usuário: "Compartilhe o relatório Q2 com o time"

Sistema:
  1. Identifica ferramenta: send_message
  2. Detecta: MEDIA: pattern em message
  3. Bloqueia a execução
  4. Modelo solicita confirmação ao usuário
  5. Usuário confirma (explicitamente)
  6. Modelo reconhece confirmação
  7. Envia arquivo

Resultado: ✅ Relatório só é enviado após confirmação clara
```

### Caso 3: Múltiplos Arquivos

```
Usuário: "Envie estes 3 documentos para o cliente"

Sistema:
  1. Modelo identifica 3 arquivos
  2. Tenta: send_message com "MEDIA:/doc1.pdf MEDIA:/doc2.pdf MEDIA:/doc3.pdf"
  3. Bloqueado (detecta múltiplos MEDIA:)
  4. Modelo lista: "Vou enviar:
     - documento1.pdf
     - documento2.pdf
     - documento3.pdf
     para o cliente X. Confirma?"
  5. Usuário: "Sim, todos"
  6. Executa envio

Resultado: ✅ Usuário revisa EXATAMENTE quais arquivos serão enviados
```

### Caso 4: Mensagem de Texto Pura (Sem Arquivo)

```
Usuário: "Diga ao João que a reunião é amanhã"

Sistema:
  1. Modelo gera: send_message(target="João", message="A reunião é amanhã")
  2. Detecta: Sem "MEDIA:"
  3. NÃO bloqueia
  4. Executa normalmente

Resultado: ✅ Mensagens de texto funcionam sem obstáculos
```

### Caso 5: Leitura de Arquivo (Sem Compartilhamento)

```
Usuário: "Leia o relatório e resuma para mim"

Sistema:
  1. Modelo gera: read_file(path="/path/report.pdf")
  2. Detecta: Não é send_message ou wacli
  3. NÃO bloqueia
  4. Executa e lê arquivo
  5. Retorna resumo ao usuário

Resultado: ✅ Leitura de arquivos funciona normalmente
```

### Caso 6: Edição de Arquivo (Sem Compartilhamento)

```
Usuário: "Crie um documento com os pontos da reunião"

Sistema:
  1. Modelo gera: write_file(path="/file.txt", content="...")
  2. Detecta: Não é send_message
  3. NÃO bloqueia
  4. Escreve arquivo localmente

Resultado: ✅ Edição funciona normalmente
```

---

## ⚠️ Limitações Conhecidas

### Limitação 1: Caminhos com Espaços

**Problema:** Arquivo com espaço no caminho pode não ser detectado corretamente

```python
# Isso funciona:
message = "MEDIA:/home/user/photo.jpg"

# Isso NÃO funciona (espaço interrompe detecção):
message = "MEDIA:/home/user/my photo.jpg"
# → Detecta apenas: "/home/user/my"

# Workaround 1: Use aspas (depende da implementação):
message = 'MEDIA:"/home/user/my photo.jpg"'

# Workaround 2: Use escape:
message = r"MEDIA:/home/user/my\ photo.jpg"

# Workaround 3: Renomeie arquivo sem espaços:
message = "MEDIA:/home/user/my_photo.jpg"
```

**Prioridade:** Baixa (caminhos com espaços são raros em automação)  
**Solução Futura:** Melhorar regex para suportar quoted paths

---

### Limitação 2: Caracteres Especiais em Caminho

**Problema:** Alguns caracteres especiais podem quebrar detecção

```python
# Estes funcionam:
"MEDIA:/path/file-name_2026.pdf"  # ✅ hífen e underscore

# Estes podem ter problemas:
"MEDIA:/path/file(copy).pdf"      # ? parênteses
"MEDIA:/path/file[1].pdf"         # ? colchetes
```

**Prioridade:** Baixa  
**Solução Futura:** Expandir regex para caracteres especiais

---

### Limitação 3: Fluxo de Confirmação

**Problema:** Atualmente, o bloqueio força o modelo a reconhecer confirmação

**Cenário problemático:**
```
Usuário: "Envie a foto"
Modelo: "Vou enviar foto.jpg para Maria. Confirma?"
Usuário: "Sim"
Modelo: [Tenta send_message novamente]
Sistema: [Bloqueado NOVAMENTE - modelo ainda não "aprendeu" que teve permissão]
Modelo: [Loop indefinido ou resposta confusa]
```

**Causa Raiz:** A policy bloqueia todas as tentativas de envio com MEDIA:, sem verificar se houve confirmação prévia do usuário na conversa

**Impacto:** Modelo pode precisar de múltiplas tentativas ou reformulação de prompt

**Prioridade:** Média  
**Solução Futura:** Implementar rastreamento de confirmação por sessão ou usar abstração maior que send_message

---

### Limitação 4: Compatibilidade com Diferentes Plataformas

**Problema:** Diferentes plataformas (WhatsApp, Telegram, Discord) podem ter sintaxes diferentes

```python
# send_message genérico:
"MEDIA:/path/file.pdf"

# Mas cada plataforma pode ter formato específico:
# WhatsApp (wacli): "wacli send file --file /path --to +55..."
# Telegram: via python-telegram-bot SDK
# Discord: via discord.py
```

**Impacto:** Policy de MEDIA: cobre send_message genérico, mas wacli e outros podem ter sintaxes diferentes

**Prioridade:** Média  
**Solução Futura:** Estender policy para detectar padrões específicos de cada plataforma

---

### Limitação 5: Sem Suporte a Confirmação Programática

**Problema:** Não há mecanismo programático para marcar "confirmado" sem reimplementar

**Cenário:**
```
Usuário quer confirmar automaticamente em certos contextos
Exemplo: Script que envia relatório mensalmente

# Não há forma de dizer: "Este envio está confirmado"
# sem modificar a source code
```

**Prioridade:** Baixa (por design - queremos sempre pedir confirmação)  
**Solução Futura:** Sistema de "aprovação em lote" para contextos automatizados

---

### Limitação 6: Detecção Baseada em String Pattern

**Problema:** Detecta apenas MEDIA: literal. Não detecta se arquivo é passado por:
- Variável/indireção
- Resultado de função
- Construção dinâmica

```python
# Detectado:
message = "MEDIA:/path/file.pdf"

# NÃO detectado (não há MEDIA: string literal):
filename = "/path/file.pdf"
message = f"MEDIA:{filename}"

# NÃO detectado:
message = build_media_message("/path/file.pdf")

# NÃO detectado:
message = compose(["Aqui está:", get_attachment()])
```

**Impacto:** Muito baixo (MEDIA: é padrão do send_message tool no Hermes)  
**Prioridade:** Muito baixa  
**Solução Futura:** AST parsing do código gerado (overkill para este caso)

---

### Limitação 7: Sem Controle Granular por Tipo de Arquivo

**Problema:** Política bloqueio é all-or-nothing. Sem diferenciação entre:
- Arquivo público vs. confidencial
- Imagem vs. documento
- Interno vs. externo

```python
# Tudo é bloqueado igual:
"MEDIA:/public/marketing.pdf"     # Bloqueado (mas é público)
"MEDIA:/confidential/salary.xlsx" # Bloqueado (correto - confidencial)
```

**Prioridade:** Baixa (pode ser adicionado depois se necessário)  
**Solução Futura:** Metadados de arquivo + policy baseada em tags

---

### Limitação 8: Terminal Commands Não Cobertos

**Problema:** Comandos via `terminal` tool não são cobertos

```python
# Estes NÃO são detectados/bloqueados:
terminal("scp file.pdf user@remote:/path")
terminal("curl -X POST --data-binary @file.pdf https://...")
terminal("aws s3 cp file.pdf s3://bucket/")
terminal("wacli send file --file file.pdf")
```

**Impacto:** Usuários avançados podem contornar via shell commands  
**Prioridade:** Média (exige conhecimento técnico)  
**Solução Futura:** Analisar comandos terminal para padrões de envio

---

## 🔮 Roadmap de Melhorias

### Sprint 1 (Curto Prazo)
- [ ] Melhorar regex para caminhos com espaços
- [ ] Adicionar suporte a caracteres especiais
- [ ] Melhorar documentação de casos extremos

### Sprint 2 (Médio Prazo)
- [ ] Sistema de rastreamento de confirmação por sessão
- [ ] Estender para detectar padrões terminal
- [ ] Suporte a diferentes plataformas (wacli, etc.)

### Sprint 3 (Longo Prazo)
- [ ] Metadados de arquivo + classificação
- [ ] Políticas customizáveis por tipo de arquivo
- [ ] Integração com sistema de aprovação enterprise

---

## 🧪 Teste de Limitações

### Teste 1: Caminho com Espaço

```
input:  "MEDIA:/home/user/my photo.jpg"
detected: False (esperado - limitação conhecida)
workaround: Renomear para "my_photo.jpg"
```

### Teste 2: Confirmação Dinâmica

```
input:  message = f"MEDIA:{filename}"
detected: False (esperado - pattern não encontrado)
impact: Muito baixa (MEDIA: é literal no send_message)
```

### Teste 3: Terminal Command

```
input:  terminal("scp file.pdf server:/path")
detected: False (esperado - não cobre terminal)
impact: Média (requer conhecimento técnico)
status: Planejado para Sprint 2
```

---

## 📊 Matriz de Suporte

| Caso | Suportado | Detectado | Bloqueado | Notas |
|------|-----------|-----------|-----------|-------|
| send_message + MEDIA: | ✅ | ✅ | ✅ | Principal caso |
| send_message puro | ✅ | ✅ | ❌ | Sem arquivo |
| read_file | ✅ | ✅ | ❌ | Lê, não envia |
| write_file | ✅ | ✅ | ❌ | Escreve local |
| terminal + scp | ⚠️ | ❌ | ❌ | Limitação conhecida |
| wacli send file | ⚠️ | ✅ | ⚠️ | Detecta ferramenta, não args |
| Multi-arquivo | ✅ | ✅ | ✅ | Múltiplos MEDIA: |
| Arquivo com espaço | ⚠️ | ⚠️ | ⚠️ | Limitação regex |
| Caracteres especiais | ⚠️ | ⚠️ | ⚠️ | Depend. do caractere |

**Legenda:** ✅ Totalmente suportado | ⚠️ Parcialmente/Com workaround | ❌ Não suportado

---

## 💡 Recomendações para Usuários

### Para Máxima Segurança (Recomendado)

1. **Use caminhos simples** sem espaços ou caracteres especiais
2. **Confirme explicitamente** cada envio de arquivo
3. **Revise a lista de arquivos** antes de confirmar
4. **Não use terminal para enviar** arquivos quando possível

### Para Casos Avançados

1. **Renomeie arquivos** se tiverem espaços (uso underscore)
2. **Use send_message** em vez de terminal
3. **Acompanhe logs** para "yami_file_sharing_policy"
4. **Reporte limitações** se encontrar casos não cobertos

---

## 🎯 Conclusão

A Regra 2 cobre os **casos de uso comuns** com **bloqueio efetivo**. As limitações conhecidas são **mitigáveis** através de práticas simples e serão **resolvidas em sprints futuras**.

Para casos extremos ou avançados, consulte a documentação ou abra uma issue.

---

**Última Atualização:** 2026-06-08  
**Versão:** 1.0
