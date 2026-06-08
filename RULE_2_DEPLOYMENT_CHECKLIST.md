# Regra 2 - Checklist de Implantação e Verificação

## 🚀 Pré-Implantação

### ✅ Verificações de Código

- [ ] **Sintaxe Python**
  ```bash
  python -m py_compile hermes-adapted/agent/file_sharing_policy.py
  python -m py_compile hermes-adapted/agent/tool_executor.py
  python -m py_compile hermes-adapted/agent/tool_guardrails.py
  python -m py_compile runtime/os_agent/core/permissions.py
  ```
  **Esperado:** Sem erros de sintaxe

- [ ] **Validação JSON**
  ```bash
  python -c "import json; json.load(open('yami.json'))"
  python -c "import json; json.load(open('runtime/yami-manifest.json'))"
  ```
  **Esperado:** JSON válido e bem-formado

- [ ] **Import de módulos**
  ```bash
  cd C:\Users\vinim\.yami
  python -c "from hermes-adapted.agent.file_sharing_policy import involves_file_sharing, get_block_message"
  ```
  **Esperado:** Imports funcionam sem erro

### ✅ Verificações de Arquivo

- [ ] **Arquivo criado:** `hermes-adapted/agent/file_sharing_policy.py`
  - Tamanho: ~70 linhas
  - Contém: `involves_file_sharing()` e `get_block_message()`

- [ ] **Arquivo modificado:** `hermes-adapted/agent/tool_executor.py`
  - Linha ~32: Import do módulo de política
  - Linha ~377: Check de política no caminho concurrent
  - Linha ~872: Check de política no caminho sequential

- [ ] **Arquivo modificado:** `hermes-adapted/agent/tool_guardrails.py`
  - MUTATING_TOOL_NAMES inclui `"wacli"`
  - Comentário sobre Regra 2

- [ ] **Arquivo modificado:** `runtime/os_agent/core/permissions.py`
  - `"upload_file"` alterado para `CONFIRM`
  - `"share_file"` adicionado como `CONFIRM`

- [ ] **Arquivo modificado:** `yami.json`
  - `rules.fileSharePolicy` expandido com detalhes
  - Contém todas 12 categorias de arquivo
  - Fluxo esperado documentado

- [ ] **Arquivo modificado:** `runtime/yami-manifest.json`
  - `rules.fileSharePolicyEnforced` com dados completos
  - Campos: enabled, name, description, implementation, block_tools

- [ ] **Documentação criada:** `RULE_2_FILE_SHARING_POLICY.md`
  - Tamanho: ~400 linhas
  - Contém guia completo

---

## 🧪 Testes Unitários

### Executar Suite de Testes

```bash
cd C:\Users\vinim\.yami
python -m pytest hermes-adapted/agent/test_file_sharing_policy.py -v
```

**Ou sem pytest:**

```bash
cd C:\Users\vinim\.yami
python hermes-adapted/agent/test_file_sharing_policy.py
```

### ✅ Testes que Devem Passar

**Grupo 1: Detecção Básica (6 testes)**
- [ ] `test_send_message_with_media_prefix` - MEDIA: no meio
- [ ] `test_send_message_with_media_prefix_at_start` - MEDIA: no início
- [ ] `test_send_message_with_multiple_media` - Múltiplos MEDIA:
- [ ] `test_send_message_without_media` - Sem MEDIA: (deve passar)
- [ ] `test_send_message_with_media_in_text_not_prefix` - "media" como texto
- [ ] `test_other_tools_not_affected` - Outras ferramentas não bloqueadas

**Grupo 2: Bloqueio (3 testes)**
- [ ] `test_block_message_returned_for_send_message_with_media` - Bloqueia com MEDIA:
- [ ] `test_no_block_message_for_send_message_without_media` - Não bloqueia sem MEDIA:
- [ ] `test_block_message_contains_action_items` - Mensagem tem instruções

**Grupo 3: Casos Extremos (8 testes)**
- [ ] `test_media_with_special_characters` - Caracteres especiais
- [ ] `test_media_with_windows_path` - Path Windows com backslash
- [ ] `test_case_sensitivity_media_prefix` - Case-sensitivity (MEDIA: vs media:)
- [ ] `test_media_without_colon` - MEDIA sem :
- [ ] `test_multiple_targets_format` - Diferentes formatos de target
- [ ] `test_very_long_path` - Caminho muito longo
- [ ] `test_unicode_in_path` - Caracteres Unicode
- [ ] `test_media_with_spaces` - MEDIA com espaços

**Grupo 4: Integração (2 testes)**
- [ ] `test_full_blocking_flow_send_message` - Fluxo completo
- [ ] `test_no_blocking_for_pure_text_message` - Mensagem pura OK

**Total:** ~19 testes

---

## 🔄 Testes Manuais em Tempo Real

### Teste 1: Detecção de send_message com MEDIA:

```python
# No agente em execução:
from hermes-adapted.agent.file_sharing_policy import involves_file_sharing, get_block_message

# Teste 1a: COM arquivo
args = {
    "target": "maria@example.com",
    "message": "Aqui está: MEDIA:/home/user/photo.jpg"
}
print(involves_file_sharing("send_message", args))  # Esperado: True
block_msg = get_block_message("send_message", args)
print(block_msg is not None)  # Esperado: True
print("COMPARTILHAMENTO" in block_msg)  # Esperado: True

# Teste 1b: SEM arquivo
args = {
    "target": "john",
    "message": "Olá, tudo bem?"
}
print(involves_file_sharing("send_message", args))  # Esperado: False
print(get_block_message("send_message", args))  # Esperado: None
```

### Teste 2: Integração com tool_executor

```python
# Simula chamada de ferramenta:
tool_name = "send_message"
function_args = {
    "action": "send",
    "target": "user@example.com",
    "message": "MEDIA:/home/user/document.pdf Veja este arquivo"
}

# Verifica bloqueio
from hermes-adapted.agent.file_sharing_policy import get_block_message
block_msg = get_block_message(tool_name, function_args)

if block_msg is not None:
    # Esperado: Ferramenta é bloqueada
    print("✅ Ferramenta bloqueada corretamente")
    print(f"Mensagem: {block_msg}")
else:
    print("❌ Ferramenta NÃO foi bloqueada (ERRO)")
```

### Teste 3: Fluxo Completo de Usuário

```
Usuário: "Envie a foto reunião para Maria"
↓
Sistema detecta "send_message" com intenção de enviar foto
↓
BLOQUEADO: "COMPARTILHAMENTO DE ARQUIVO BLOQUEADO - Regra 2"
↓
Modelo recebe mensagem de bloqueio
↓
Modelo pergunta: "Você quer que eu envie a foto para Maria? (sim/não)"
↓
Usuário: "Sim"
↓
Modelo tenta de novo
↓
BLOQUEADO NOVAMENTE (porque modelo ainda não reconheceu confirmação)
↓
Modelo pensa e pergunta explicitamente:
"Confirmado. Vou enviar foto_reuniao.jpg para Maria. Você autoriza?"
↓
Usuário: "Autorizo"
↓
Modelo agora "entende" que tem permissão
↓
... (modelo precisará usar uma abstração mais alta que send_message
      ou o fluxo precisa de implementação de confirmação de usuário)
```

---

## 📊 Comportamento Esperado Pós-Implantação

### ✅ O que Deve Funcionar

| Ação do Usuário | Esperado | Real |
|-----------------|----------|------|
| "Envie a foto para Maria" | ✅ Bloqueado, pede confirmação | [ ] |
| "Compartilhe o PDF com João" | ✅ Bloqueado, pede confirmação | [ ] |
| "Anexe este arquivo ao email" | ✅ Bloqueado, pede confirmação | [ ] |
| "Olá, tudo bem?" (sem arquivo) | ✅ Normal, sem bloqueio | [ ] |
| `send_message` sem MEDIA: | ✅ Normal, sem bloqueio | [ ] |
| `read_file` | ✅ Normal, sem bloqueio | [ ] |
| `write_file` | ✅ Normal, sem bloqueio | [ ] |

### ❌ O que NÃO Deve Acontecer

| Cenário | Não Deve | Real |
|---------|----------|------|
| Arquivo enviado sem confirmação | ❌ Acontecer | [ ] |
| MEDIA: não detectado | ❌ Acontecer | [ ] |
| Outra ferramenta bloqueada | ❌ Acontecer | [ ] |
| Sem mensagem de erro clara | ❌ Acontecer | [ ] |

---

## 🔍 Verificações de Segurança

### ✅ Testes de Bypass

```python
# Teste 1: Pode bypassa com "MEDIA" (minúsculo)?
args = {"target": "user", "message": "media:/path/file.pdf"}
print(involves_file_sharing("send_message", args))  # Esperado: False (case-sensitive)

# Teste 2: Pode bypassar sem espaço após MEDIA?
args = {"target": "user", "message": "MEDIA:/path/file"}
print(involves_file_sharing("send_message", args))  # Esperado: True

# Teste 3: Pode bypassar com outro prefixo?
args = {"target": "user", "message": "FILE:/path/file.pdf"}
print(involves_file_sharing("send_message", args))  # Esperado: False

# Teste 4: Pode bypassar com "MEDIA :" (espaço antes de :)?
args = {"target": "user", "message": "MEDIA :/path/file.pdf"}
print(involves_file_sharing("send_message", args))  # Esperado: False
```

**Esperado:** Nenhum bypass funciona

### ✅ Teste de Efeito Colateral

```python
# Testes que outras ferramentas NÃO são afetadas:
from hermes-adapted.agent.file_sharing_policy import get_block_message

tools_not_affected = [
    ("read_file", {"path": "/file.txt"}),
    ("write_file", {"path": "/file.txt", "content": "text"}),
    ("terminal", {"command": "echo hello"}),
    ("todo", {"todos": []}),
    ("memory", {"action": "add", "content": "note"}),
    ("execute_code", {"code": "print('hello')"}),
]

for tool_name, args in tools_not_affected:
    msg = get_block_message(tool_name, args)
    assert msg is None, f"❌ {tool_name} foi bloqueado (não deveria ser)"
    print(f"✅ {tool_name} não é afetado")
```

---

## 📈 Métricas de Sucesso

### Pré-Implementação
- Nenhuma proteção contra envio automático de arquivos
- Usuário pode sem querer fazer auto-share

### Pós-Implementação
- [ ] **0 arquivos** enviados sem confirmação explícita
- [ ] **100%** das tentativas de send_message com MEDIA: são bloqueadas
- [ ] **0 falsos positivos** (outras ferramentas funcionam normalmente)
- [ ] **100% clareza** (mensagem de bloqueio explica exatamente o que fazer)

---

## 🐛 Debug e Troubleshooting

### Problema: Ferramenta não está sendo bloqueada

**Verificação 1:** Import funcionando?
```python
from hermes-adapted.agent.file_sharing_policy import get_block_message
```

**Verificação 2:** Função está sendo chamada?
```python
# Adicione print em tool_executor.py:
fs_block_message = _get_file_sharing_block_message(function_name, function_args)
print(f"DEBUG: fs_block_message = {fs_block_message}")
```

**Verificação 3:** Padrão MEDIA: está correto?
```python
import re
MEDIA_PREFIX_RE = re.compile(r'MEDIA:\s*\S+')
message = "MEDIA:/path/file.pdf"
print(MEDIA_PREFIX_RE.search(message))  # Deve encontrar match
```

### Problema: Arquivo com espaço no caminho não está detectado

**Esperado:** Caminhos com espaços NOT são detectados por design
```python
# Isso NÃO detecta (por causa da regex \S+):
message = "MEDIA:/path with spaces/file.pdf"

# Para arquivos com espaços, use:
message = 'MEDIA:"/path with spaces/file.pdf"'
# Ou use escape:
message = "MEDIA:/path\\ with\\ spaces/file.pdf"
```

### Problema: Mensagem de bloqueio não aparece

1. Verifique se error_type está sendo definido como `yami_file_sharing_policy`
2. Verifique logs com: `grep "yami_file_sharing_policy" logfile.txt`
3. Adicione print statements em `get_block_message()`

---

## ✅ Checklist Final de Implantação

### Antes de Ativar

- [ ] Todos os testes unitários passam
- [ ] Sintaxe Python válida
- [ ] JSON válido
- [ ] Imports funcionam
- [ ] Documentação completa
- [ ] Código review aprovado

### Ativação

- [ ] Deploy em ambiente de desenvolvimento
- [ ] Testes manuais passam
- [ ] Logs mostram bloqueios corretos
- [ ] Nenhum falso positivo
- [ ] Deploy em staging
- [ ] Testes de aceitação passam
- [ ] Deploy em produção

### Pós-Implantação (24h)

- [ ] Monitorar logs para `yami_file_sharing_policy`
- [ ] Verificar se nenhum erro está sendo gerado
- [ ] Confirmar que compartilhamento de arquivos funciona com confirmação
- [ ] Feedback de usuários coletado

### Semana 1

- [ ] Coleta de métricas completa
- [ ] Análise de logs
- [ ] Ajustes finos se necessário
- [ ] Documentação atualizada se necessário

---

## 📞 Contatos e Escalação

**Implementador:** [Seu Nome/Time]  
**Data de Implantação:** [Data]  
**Versão YAMI:** 0.1.0-yami.1+  
**Status:** [Pendente / Em Testes / Ativo]

---

## 📝 Log de Implantação

```
[Data/Hora] Iniciar implementação
[Data/Hora] Criar file_sharing_policy.py
[Data/Hora] Modificar tool_executor.py
[Data/Hora] Modificar permissions.py
[Data/Hora] Atualizar yami.json
[Data/Hora] Testes unitários: [X]/[Y] passando
[Data/Hora] Testes manuais: OK / PENDENTE / FALHA
[Data/Hora] Deploy: OK / PENDENTE / FALHA
```

---

**Última Atualização:** 2026-06-08  
**Versão:** 1.0
