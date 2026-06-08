# Integrações Yami - Guia do Usuário

## 🎯 O que é?

O Yami agora possui um **sistema universal de contas**. Configure suas contas uma única vez e o Yami as reutiliza automaticamente para todas as funcionalidades compatíveis.

## ✨ Como Funciona

### Configuração Única

1. Você conecta sua conta Google **uma única vez** no painel de Integrações
2. Yami armazena a conexão de forma segura
3. De agora em diante, Yami usa essa conexão para:
   - Ler seus e-mails
   - Consultar sua agenda
   - Buscar arquivos no Drive
   - Gerenciar suas fotos
   - E muito mais!

**Sem necessidade de reconfiguração toda vez que você pede algo novo.**

## 🔗 Provedores Disponíveis

### E-mail e Agenda
- **Google** — Gmail, Google Agenda, Google Drive, Google Fotos
- **Microsoft** — Outlook, OneDrive, Microsoft 365
- **Apple** — iCloud, Apple Mail, Calendário

### Mensageiros
- **WhatsApp** — Já conectado e funcionando
- **Telegram** — Mensagens e canais
- **Discord** — Servidores e canais
- **Slack** — Canais corporativos

### Desenvolvimento
- **GitHub** — Repositórios, issues, actions
- **GitLab** — Repositórios, CI/CD, projetos

### Armazenamento
- **Google Drive** — Backup e organização de arquivos
- **OneDrive** — Armazenamento Microsoft

### Produtividade
- **Notion** — Notas e wikis
- **Trello** — Quadros e cartões
- **Obsidian** — Notas locais

### Terceiros
- **Spotify** — Música e controle de reprodução

## 🚀 Como Conectar uma Conta

### Passo 1: Abrir Integrações
1. Clique no **menu ☰** no Dashboard Yami
2. Selecione **"Integracoes"**

### Passo 2: Conectar Provedor
1. Na seção **"Provedores disponíveis"**
2. Localize o provedor que deseja (ex: Google)
3. Clique em **"Conectar"**
4. Digite o e-mail da sua conta (opcional)
5. Siga as instruções de autorização

### Passo 3: Autorizar
- Uma janela de login do provedor abrirá
- Você autoriza Yami a acessar sua conta
- Escolha quais permissões conceder
- **Pronto!** Sua conta está conectada

## 📊 Gerenciar Contas Conectadas

### Na seção "Contas Conectadas"

Cada conta mostra:
- **Status**: Se está conectada e funcionando
- **Permissões**: O que Yami pode fazer
- **Última sincronização**: Quando Yami sincronizou pela última vez
- **Botões de ação**:
  - 🔄 **Sincronizar** — Forçar atualização agora
  - ✕ **Desconectar** — Remover a conexão

### Sincronização Automática
Yami sincroniza automaticamente a cada 15 minutos. Você não precisa fazer nada!

## 🔒 Segurança

### Como Yami Acessa Suas Contas?
- Usa **OAuth 2.0** (protocolo seguro de autorização)
- Nunca pedimos sua senha
- Você controla o que Yami pode fazer
- Pode revogar acesso a qualquer momento

### Permissões Granulares
Cada provedor define exatamente o que Yami pode fazer:
- ✓ Google: Ler e-mails, consultar agenda, buscar arquivos
- ✓ WhatsApp: Enviar e receber mensagens
- ✓ GitHub: Ver repositórios e issues

**Nunca deletamos dados. Nunca modificamos sem sua autorização explícita.**

## 💡 Exemplos de Uso

### Exemplo 1: Perguntar sobre Agenda
```
Você: "Quais são meus compromissos para amanhã?"
Yami: (conecta com Google Calendar automaticamente)
→ "Você tem 3 compromissos: ..."
```

### Exemplo 2: Gerenciar E-mails
```
Você: "Mostre meus e-mails importantes"
Yami: (usa Gmail sem precisar reconectar)
→ "Você tem 5 e-mails importantes de..."
```

### Exemplo 3: Buscar Arquivos
```
Você: "Procure por 'Relatório 2026' no Google Drive"
Yami: (usa Drive conectado)
→ "Encontrei 3 arquivos: ..."
```

### Exemplo 4: Verificar GitHub
```
Você: "Quantos PRs abertos tenho no GitHub?"
Yami: (consulta GitHub automaticamente)
→ "Você tem 2 PRs abertos: ..."
```

## ⚠️ Troubleshooting

### "Conta não encontrada"
**Problema**: Yami diz que a conta não está conectada

**Solução**:
1. Abra "Integracoes" no menu
2. Procure a conta desconectada
3. Clique "Conectar"
4. Siga o processo de autorização

### "Permissões revogadas"
**Problema**: Yami avisa que perdeu acesso

**Solução**:
- Você revogou acesso no painel do provedor
- Clique "Sincronizar" em Integrações
- Se persistir, desconecte e reconecte

### "Última sincronização nunca"
**Problema**: A conta foi conectada mas nunca sincronizou

**Solução**:
- Clique "Sincronizar" manualmente
- Espere 30 segundos
- Se não funcionar, reconecte

### "Token expirado"
**Problema**: Aparece mensagem de erro de autenticação

**Solução**: Yami renovará automaticamente em:
1. Próxima sincronização automática (15 min)
2. Ou clique "Sincronizar" agora em Integrações

## 🚫 Como Desconectar

1. Abra **Integrações**
2. Encontre a conta em "Contas Conectadas"
3. Clique **"Desconectar"**
4. Confirme a ação

**Efeito:**
- Yami perderá acesso àquela conta
- Você poderá reconectar depois se quiser
- Suas contas originais **não são afetadas** (estão seguras no provedor)

## 📱 Múltiplas Contas

### Conectar 2 Contas Google
**Em breve!** Você poderá conectar múltiplas contas do mesmo provedor:
```
- Google Pessoal (gmail)
- Google Trabalho (empresa)
```

## 🔮 Futuro

Novos provedores virão em breve:
- [ ] Dropbox
- [ ] Asana
- [ ] Monday.com
- [ ] Facebook / Instagram
- [ ] LinkedIn
- [ ] AWS / Azure
- [ ] E mais!

## ❓ Perguntas Frequentes

**P: Preciso reconectar minha conta toda vez?**
R: Não! Configure uma vez e Yami reutiliza.

**P: Minhas credenciais são armazenadas?**
R: Sua senha? Nunca. Tokens de acesso? Sim, localmente.

**P: Posso usar em múltiplos dispositivos?**
R: Não por enquanto. Em breve você poderá sincronizar entre devices.

**P: E se Yami ser hackeado?**
R: Você pode revogar acesso de qualquer conta em minutos pelo provedor.

**P: Funciona offline?**
R: Operações locais sim. Acesso a serviços online requer conexão.

**P: Posso compartilhar meu Yami com outra pessoa?**
R: Não recomendamos. Suas contas seriam compartilhadas também.

## 📞 Suporte

Encontrou um problema?
1. Verifique o status das contas em "Integrações"
2. Tente "Sincronizar" manualmente
3. Desconecte e reconecte se necessário
4. Reporte em: https://github.com/anomalyco/opencode

---

**Resumo:** Conecte suas contas uma vez, e Yami as usa automaticamente! 🚀
