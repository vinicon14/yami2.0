# YAMI Regra 2: Política de Compartilhamento Explícito de Arquivos

## 📋 Resumo Executivo

**Regra Principal:** Nenhum arquivo deve ser enviado automaticamente. O YAMI só compartilha arquivos quando há uma solicitação **explícita** do usuário.

Esta política implementa camadas rigorosas de proteção para garantir que:
- ✅ Arquivos só são compartilhados com consentimento explícito do usuário
- ✅ O acesso ao arquivo não concede autorização para compartilhá-lo
- ✅ A decisão final sempre permanece com o usuário
- ✅ O processo é transparente, previsível e seguro

---

## 🎯 Escopo

Esta política se aplica a **todos** os tipos de conteúdo digital:

- Fotos
- Vídeos
- Áudios
- Documentos
- PDFs
- Planilhas
- Apresentações
- Arquivos compactados
- Capturas de tela
- Arquivos do computador
- Arquivos da nuvem
- Qualquer outro tipo de conteúdo digital

---

## 🔄 Fluxo Esperado

O YAMI implementa um fluxo rigoroso de 4 etapas:

```
1. USUÁRIO SOLICITA O ENVIO
   "Envie a foto da reunião para Maria"
   "Compartilhe o PDF com João"
   "Anexe o relatório ao e-mail"

   ↓

2. YAMI IDENTIFICA OS ARQUIVOS RELEVANTES
   - Encontra o arquivo correspondente
   - Verifica caminho e permissões
   - Prepara o conteúdo

   ↓

3. YAMI CONFIRMA O CONTEÚDO
   "Vou enviar [arquivo.pdf] para [Maria] contendo [resumo do conteúdo].
    Você confirma?"

   ↓ (aguarda confirmação explícita do usuário)

4. YAMI EXECUTA O COMPARTILHAMENTO
   - Envia o arquivo apenas após confirmação
   - Log de auditoria registra a operação
   - Confirmação de entrega ao usuário
```

---

## ✅ Exemplos Permitidos

```
Usuário: "Envie a foto da reunião para Maria"
YAMI:    "Vou enviar foto_reuniao_2026_06_08.jpg para Maria. Confirma?"
Usuário: "Sim, envie"
YAMI:    [Executa o envio]

---

Usuário: "Compartilhe o relatório mais recente com João"
YAMI:    "Encontrei relatorio_vendas_q2_2026.pdf. Vou enviar para João. OK?"
Usuário: "Pode enviar"
YAMI:    [Executa o envio]

---

Usuário: "Anexe este documento ao e-mail"
YAMI:    "Vou anexar documento.docx ao seu e-mail. Confirma?"
Usuário: "Confirmo"
YAMI:    [Executa o envio]
```

---

## ❌ Exemplos NÃO Permitidos

```
❌ Compartilhar arquivos automaticamente por contexto
   YAMI não deve inferir: "O usuário mencionou 'reunião', talvez
   ele queira enviar a foto da reunião automaticamente"

❌ Presumir autorização
   YAMI não deve assumir: "Como tenho acesso ao arquivo, posso
   compartilhá-lo"

❌ Enviar anexos sem pedido direto
   YAMI não deve: "Encontrei um PDF interessante, vou enviar"

❌ Sugerir e executar automaticamente
   YAMI não deve: "Sugiro enviar este arquivo... (e executa sem esperar resposta)"
```

---

## 🔒 Implementação Técnica

### Arquitetura de Bloqueio

A política é implementada em **múltiplas camadas** para máxima segurança:

#### 1. **Camada de Despacho de Ferramentas** (Tool Dispatch Layer)
   - **Arquivo:** `hermes-adapted/agent/tool_executor.py`
   - **Mecanismo:** Intercepta todas as chamadas de ferramentas antes da execução
   - **Ferramentas Bloqueadas:**
     - `send_message` (com anexos via `MEDIA:` syntax)
     - `wacli` (WhatsApp CLI com envio de arquivos)

#### 2. **Módulo de Política de Compartilhamento** (File Sharing Policy)
   - **Arquivo:** `hermes-adapted/agent/file_sharing_policy.py`
   - **Funções:**
     - `involves_file_sharing()` - Detecta se a chamada envolve arquivo
     - `get_block_message()` - Retorna mensagem de bloqueio se violar política

#### 3. **Permissões do Agente OS** (OS Agent Permissions)
   - **Arquivo:** `runtime/os_agent/core/permissions.py`
   - **Classificação:** `upload_file` e `share_file` = `CONFIRM` level
   - **Efeito:** Requer confirmação para qualquer operação de compartilhamento

#### 4. **Guardrails de Ferramentas** (Tool Guardrails)
   - **Arquivo:** `hermes-adapted/agent/tool_guardrails.py`
   - **Classificação:** `send_message` e `wacli` em `MUTATING_TOOL_NAMES`
   - **Efeito:** Monitora uso repetido e detecta loops

---

### Fluxo de Execução

```
Model generate tool_call: send_message(target="...", message="MEDIA:/path ...")
     ↓
tool_executor.py: execute_tool_calls_concurrent/sequential()
     ↓
[1] Plugin block message check (hermes_cli.plugins)
     ↓ (if not blocked)
[2] ⭐ YAMI File Sharing Policy check
     ├─ _get_file_sharing_block_message(function_name, function_args)
     ├─ Check if tool is in FILE_SHARING_TOOLS
     ├─ Check if message contains MEDIA: prefix
     └─ If YES → Return block message → Synthesize error result → Skip execution
     ↓ (if not blocked)
[3] Guardrail decision check (tool_guardrails.before_call)
     ↓ (if not blocked)
[4] Execute the tool
     ↓
Result returned to model
```

---

### Detecção de Compartilhamento de Arquivos

#### Para `send_message`:
```python
MEDIA_PREFIX_RE = re.compile(r'MEDIA:\s*\S+')

# Detecta padrão como:
"Vou enviar para você. MEDIA:/home/user/document.pdf"
"Aqui está o arquivo: MEDIA:/tmp/photo.jpg"
```

#### Para `wacli`:
- Detectado pela presença da ferramenta `wacli` com argumentos
- Terminal command pattern: `wacli send file --file /path/file`

---

## 📝 Configuração

### `yami.json` - Configuração Principal

```json
{
  "yami": {
    "rules": {
      "explicitFileShareOnly": true,
      "fileSharePolicy": {
        "description": "Regra 2: Nenhum arquivo deve ser enviado automaticamente...",
        "applies_to": [
          "fotos", "videos", "audios", "documentos", "pdfs",
          "planilhas", "apresentacoes", "arquivos_compactados",
          "capturas_de_tela", "arquivos_do_computador",
          "arquivos_da_nuvem", "qualquer_outro_conteudo_digital"
        ],
        "fluxo_esperado": [
          "1. O usuario solicita o envio",
          "2. O YAMI identifica os arquivos relevantes",
          "3. O YAMI confirma o conteudo que sera enviado",
          "4. O YAMI executa o compartilhamento"
        ],
        "principios": [
          "Controle do usuario",
          "Transparencia",
          "Previsibilidade",
          "Seguranca operacional",
          "Confirmacao de intencao",
          "Reducao de erros"
        ]
      }
    }
  }
}
```

### `yami-manifest.json` - Informações de Execução

```json
{
  "rules": {
    "shareFilesOnlyWhenExplicitlyRequested": true,
    "fileSharePolicyEnforced": {
      "enabled": true,
      "name": "Regra 2: Compartilhamento Explicito de Arquivos",
      "description": "Nenhum arquivo deve ser enviado automaticamente...",
      "implementation": "tool-dispatch-layer-blocking",
      "block_tools": ["send_message", "wacli"],
      "requires_explicit_consent": true,
      "user_confirmation_flow": "identify -> confirm -> share"
    }
  }
}
```

---

## 🛡️ Princípios Obrigatórios

### 1. **Controle do Usuário**
- O usuário mantém controle total sobre compartilhamento de arquivos
- Nenhuma ação automática sem consentimento explícito
- Usuário sempre tem a palavra final

### 2. **Transparência**
- YAMI comunica claramente qual arquivo será compartilhado
- Mensagens de bloqueio explicam exatamente por que a ação foi bloqueada
- Logs rastreiam todas as operações de compartilhamento

### 3. **Previsibilidade**
- Comportamento do YAMI é consistente e previsível
- Mesmas ações sempre resultam no mesmo comportamento
- Sem surpresas ou comportamentos emergentes

### 4. **Segurança Operacional**
- Bloqueios não podem ser contornados por padrões de prompt
- A policy é implementada na camada de execução, não no prompt
- Impossível para o modelo "convencer" o sistema a ignorar a política

### 5. **Confirmação de Intenção**
- YAMI sempre pede confirmação antes de compartilhar
- Usuário escreve explicitamente ("sim", "confirmo", "pode enviar")
- Evita acidentes por cliques, swipes ou interpretações erradas

### 6. **Redução de Erros**
- Bloqueia envios acidentais antes de ocorrem
- Força revisão do destinatário e arquivo
- Reduz drasticamente erros operacionais

---

## 📊 Mensagem de Bloqueio

Quando uma tentativa de compartilhamento é detectada, o usuário vê:

```
🔒 COMPARTILHAMENTO DE ARQUIVO BLOQUEADO - Regra 2 (Política Explícita)

O YAMI segue uma política rigorosa: nenhum arquivo pode ser enviado 
automaticamente. Os arquivos são compartilhados quando há uma solicitação 
EXPLÍCITA do usuário.

AÇÃO NECESSÁRIA:
1. Pergunte ao usuário se ele deseja enviar o arquivo
2. Liste CLARAMENTE: nome do arquivo + destinatário + conteúdo resumido
3. Aguarde confirmação EXPLÍCITA do usuário
4. Após confirmação, execute o compartilhamento

IMPORTANTE: O acesso ao arquivo não concede autorização para compartilhá-lo. 
A decisão final deve sempre permanecer com o usuário.
```

---

## 🔄 Comportamento do Modelo

Quando a política bloqueia uma tentativa:

1. **Modelo recebe mensagem de bloqueio**
2. **Modelo entende a razão do bloqueio**
3. **Modelo responde ao usuário:**
   ```
   Eu posso enviar [arquivo] para [pessoa]. Você quer que eu envie?
   ```
4. **Aguarda confirmação explícita do usuário**
5. **Ao receber confirmação, executa o compartilhamento**

---

## 🚀 Ativação

A política está **automaticamente ativada**:

- ✅ Módulo `file_sharing_policy.py` importado em `tool_executor.py`
- ✅ Verificação integrada no fluxo de despacho de ferramentas
- ✅ Sem necessidade de configuração adicional
- ✅ Sempre ativo, não pode ser desativado durante execução

---

## 📈 Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Segurança** | Impossível compartilhar dados confidenciais acidentalmente |
| **Controle** | Usuário tem controle total sobre compartilhamento |
| **Confiança** | Comportamento previsível e transparente |
| **Conformidade** | Cumpre regulações de privacidade (LGPD, GDPR, etc.) |
| **Auditoria** | Todas as operações são rastreáveis |
| **Redução de Risco** | Elimina erros de envio para destinatário errado |

---

## 🔍 Rastreamento e Auditoria

Cada tentativa de compartilhamento é registrada com:

- Timestamp da tentativa
- Nome da ferramenta (`send_message`, `wacli`)
- Argumento com arquivo detectado
- Mensagem de bloqueio
- Status (`blocked` com tipo `yami_file_sharing_policy`)
- ID do usuário/sessão

---

## 🧪 Teste da Política

### Teste 1: Bloqueio de Envio Automático

```
Usuário: "Envie a foto reuniao.jpg para Maria"
Esperado:
  ❌ Bloqueio detecta MEDIA:reuniao.jpg
  ✅ Mensagem pede confirmação explícita
  ✅ Espera resposta do usuário
```

### Teste 2: Bloqueio de wacli

```
Usuário: "Envie arquivo.pdf via WhatsApp para +55 9999999"
Esperado:
  ❌ Bloqueio detecta wacli send file
  ✅ Mensagem pede confirmação explícita
  ✅ Espera resposta do usuário
```

### Teste 3: Permissão Após Confirmação

```
Usuário: "Envie a foto"
YAMI: "Vou enviar foto.jpg para Maria. Confirma?"
Usuário: "Sim, envie"
Esperado:
  ✅ YAMI valida confirmação explícita
  ✅ Executa o envio
  ✅ Confirma ao usuário
```

---

## 📚 Referências

- **Configuração:** `yami.json` (rules.fileSharePolicy)
- **Manifestação:** `yami-manifest.json` (rules.fileSharePolicyEnforced)
- **Implementação:** 
  - `hermes-adapted/agent/file_sharing_policy.py`
  - `hermes-adapted/agent/tool_executor.py`
  - `runtime/os_agent/core/permissions.py`
  - `hermes-adapted/agent/tool_guardrails.py`

---

## 📞 Suporte

Para questões sobre esta política:

1. Consulte a documentação em `RULE_2_FILE_SHARING_POLICY.md`
2. Verifique os logs de bloqueio (tipo: `yami_file_sharing_policy`)
3. Revise o comentário de código em `file_sharing_policy.py`

---

**Última Atualização:** 2026-06-08  
**Versão:** 1.0  
**Status:** ✅ Ativo
