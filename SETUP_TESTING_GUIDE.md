# 🧪 Guia de Testes - Onboarding YAMI

## ✅ Teste 1: Primeira Execução (Setup Incompleto)

### Pré-requisitos
1. Remover chave `setup` de `~/.yami/yami.json`
2. Iniciar servidor: `node auto-panel/server.js`
3. Abrir navegador em `http://127.0.0.1:18808`

### Passos
```
1. Verificar que overlay de onboarding aparece
2. Confirmação: Deve mostrar "Bem-vindo ao Yami"
3. Verificar categorização:
   - 3 permissões em "🔴 Essencial" (vermelho)
   - 3 permissões em "⭐ Muito recomendado" (âmbar)
   - 5 permissões em "💡 Opcional" (azul)
4. Animação: Cada item deve ter fade-in sequencial
5. Ícones devem estar visíveis (📷 🔔 📁 etc.)
```

### Resultado Esperado
- Overlay totalmente opaco
- Permissões renderizadas com cores corretas
- Botão "Autorizar tudo e continuar" habilitado

---

## ✅ Teste 2: Processo de Autorização

### Passos
```
1. Clicar em "Autorizar tudo e continuar"
2. Observar animação de checkmarks ✓ sequenciais
3. Verificar que tela de progresso aparece com:
   - Barra de progresso preenchendo
   - Texto atualizando: "Solicitando permissões..." → "Finalizando..."
4. Permitir microfone quando solicitado pelo navegador
5. Permitir notificações quando solicitado
6. Para câmera: pode permitir ou negar (opcional)
```

### Resultado Esperado
- Checkmarks aparecem um por um em ~60ms
- Progresso sobe de 0% a 100%
- Nenhuma página em branco durante transição
- Browser pede permissões automaticamente

---

## ✅ Teste 3: Tela de Sucesso

### Passos
```
1. Após autorização, verificar tela de sucesso:
   - Ícone 🎉 ou ✨
   - Título "Configuração concluída!"
   - Status das 3 permissões críticas:
     * "🎤 Microfone: ✓ Autorizado" (verde) ou "✗ Negado" (cinza)
     * "🔔 Notificações: ..." 
     * "📷 Câmera: ..."
   - Botão "✨ Começar a usar o Yami"
2. Clicar no botão de conclusão
3. Verificar que overlay desaparece suavemente
4. Confirmar que Tamagotchi (avatar Y) aparece
5. Verificar que voz se inicia automaticamente
```

### Resultado Esperado
- Transição suave fade-out do overlay
- Tamagotchi visível com animação
- Painel principal carregado
- Sem erros no console

---

## ✅ Teste 4: Verificação de Dados Salvos

### Passos
```
1. Abrir DevTools (F12) → Console
2. Executar:
   fetch('/api/setup/status').then(r => r.json()).then(d => console.log(d))
3. Verificar resposta:
   - "completed": true
   - "setup": null (pois já foi completado)
```

### Verificar arquivo
```bash
# Abrir yami.json
cat ~/.yami/yami.json

# Procurar por:
"setup": {
  "completed": true,
  "completedAt": "...",
  "permissions": {
    "microphone": true,
    "notifications": true,
    "camera": false (ou true)
  }
}
```

### Resultado Esperado
- `setup.completed = true`
- Permissões salvas corretamente
- Timestamp válido em ISO 8601

---

## ✅ Teste 5: Verificação de Diretórios

### Passos
```bash
# Listar estrutura criada
ls -R ~/.yami/
```

### Deve conter
```
~/.yami/
├── comunicacao/
├── agenda/
├── arquivos/
├── fotos/
├── media/
│   └── outgoing/
├── auto-panel/tts/
└── agents/main/sessions/
```

### Resultado Esperado
- Todos os diretórios criados
- Permissões apropriadas (geralmente 755)

---

## ✅ Teste 6: Segunda Abertura (Setup Completo)

### Passos
```
1. Recarregar página (F5)
2. Verificar que onboarding NÃO aparece
3. Verificar que painel normal carrega
4. Confirmar que tudo funciona normalmente
```

### Resultado Esperado
- Overlay está oculto (aria-hidden="true")
- Tamagotchi aparece imediatamente
- Sem delay ou interferência

---

## ✅ Teste 7: Dialog de Permissões

### Passos
```
1. Clicar em ☰ (menu)
2. Navegar para seção "Segurança"
3. Clicar em "Permissões"
4. Modal deve aparecer com:
   - Mesmas 3 categorias (Essencial/Recomendado/Opcional)
   - Status atual de cada permissão (✓/✗)
5. Clicar "Fechar"
6. Modal deve sumir suavemente
```

### Resultado Esperado
- Modal aparece em posição centralizada
- Background darkens
- Status reflete permissões reais
- Pode fechar clicando em "Fechar" ou fora do modal

---

## ✅ Teste 8: Negação de Permissões

### Passos
```
1. Resetar setup: remover "setup" de yami.json
2. Iniciar novo onboarding
3. Ao ser solicitado, NEGAR microfone/notificações
4. Observar botão mudando para:
   "⚠️ Permissão negada pelo navegador..."
5. Aguardar 3 segundos
6. Botão retorna ao estado normal
7. Pode tentar novamente
```

### Resultado Esperado
- Erro capturado e tratado
- Mensagem compreensível para usuário
- Possibilidade de retry

---

## ✅ Teste 9: Responsividade

### Passos
```
1. Abrir DevTools (F12) → Device Toolbar
2. Testar em diferentes resoluções:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
3. Verificar que:
   - Card se redimensiona
   - Texto permanece legível
   - Botões permanecem clicáveis
   - Sem scroll horizontal
```

### Resultado Esperado
- Design responsivo em todas as resoluções
- Sem quebra de layout
- Font sizes apropriadas

---

## ✅ Teste 10: Performance

### Passos
```
1. Abrir DevTools → Performance
2. Gravar durante abertura do onboarding
3. Verificar:
   - Time to Interactive < 2s
   - Layout shifts mínimos
   - Sem jank em animações
4. Network tab:
   - /api/setup/status carrega em < 100ms
   - Nenhuma requisição bloqueante
```

### Resultado Esperado
- Onboarding responsivo
- Nenhum lag em animações
- API rápida

---

## 🐛 Troubleshooting

### Problema: Overlay não aparece na primeira execução
**Solução:**
```bash
# Verificar yami.json
grep -i setup ~/.yami/yami.json
# Deve estar vazio ou sem "completed": true

# Se necessário, resetar
node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('.yami/yami.json', 'utf8'));
delete cfg.setup;
fs.writeFileSync('.yami/yami.json', JSON.stringify(cfg, null, 2));
"
```

### Problema: Browser não pede permissões
**Solução:**
- Verificar se site está em HTTPS (ou localhost)
- Check DevTools → Permissions
- Chrome bloqueia por política: Settings → Privacy → Permissions

### Problema: Permissões não salvam
**Solução:**
```bash
# Verificar permissões do arquivo
ls -l ~/.yami/yami.json
# Deve ser escrevível pelo processo Node

# Verificar logs do servidor
node auto-panel/server.js 2>&1 | grep -i error
```

### Problema: Diretórios não foram criados
**Solução:**
```bash
# Criar manualmente
mkdir -p ~/.yami/{comunicacao,agenda,arquivos,fotos,media/outgoing,auto-panel/tts,agents/main/sessions}
```

---

## 📝 Checklist de Verificação Final

- [ ] Teste 1: Primeira execução mostra onboarding
- [ ] Teste 2: Processo de autorização funciona
- [ ] Teste 3: Tela de sucesso exibe status correto
- [ ] Teste 4: Dados salvos em yami.json
- [ ] Teste 5: Diretórios criados
- [ ] Teste 6: Segunda abertura não mostra overlay
- [ ] Teste 7: Dialog de permissões funciona
- [ ] Teste 8: Erros são tratados graciosamente
- [ ] Teste 9: Responsive em diferentes telas
- [ ] Teste 10: Performance adequada

---

## 🚀 Deploy

Após passar todos os testes:

```bash
# 1. Commit das mudanças
git add auto-panel/server.js auto-panel/public/index.html
git commit -m "feat: Adicionar fluxo de configuração inicial com onboarding PROMPT-17-Regra3"

# 2. Resetar yami.json para teste real
rm ~/.yami/yami.json 
# ou remover apenas a chave setup

# 3. Testar com usuário final
# Usuário novo abre YAMI → vê onboarding

# 4. Deploy em produção
npm run build && npm run deploy
```

---

**Data de criação**: 2026-06-08
**Status**: Pronto para testes completos
