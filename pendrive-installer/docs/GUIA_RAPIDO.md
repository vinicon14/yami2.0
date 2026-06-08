# Yami - Guia Rapido de Instalacao

## Requisitos

- Windows 10 ou superior (64 bits recomendado)
- 4GB+ de RAM
- 2GB+ de espaco livre em disco
- Pendrive USB com 4GB+ (opcional para instalacao portatil)

## Instalacao Plug-and-Play (via Pendrive)

1. Conecte o pendrive Yami ao computador.
2. O instalador abre automaticamente (ou clique em `YamiInstaller.exe`).
3. Siga o assistente de configuracao:
   - **Step 1**: Insira sua chave API OpenAI (ou pule para configurar depois).
   - **Step 2**: Conecte contas (WhatsApp, Google - opcional).
   - **Step 3**: Autorize permissoes (microfone, auto-start, notificacoes).
   - **Step 4**: Aguarde a instalacao automatica.
   - **Step 5**: Pronto! Clique em "Abrir Dashboard Yami".

## Primeiros Passos

### Ativar por Voz
Diga: **"Acorda Yami"**

### Pausar por Voz
Diga: **"Descansa Yami"**

### Acessar Dashboard
Abra o navegador em: [http://127.0.0.1:18808/](http://127.0.0.1:18808/)

### Comandos de Voz Rapidos
- "Acorda Yami" - Ativa o Yami
- "Descansa Yami" - Pausa o Yami
- "Abre Spotify" - Abre o Spotify
- "Abre YouTube" - Abre o YouTube
- "Abre calculadora" - Abre a calculadora
- "Status Yami" - Verifica se esta online

## Solucao de Problemas

| Problema | Solucao |
|----------|---------|
| Dashboard nao abre | Execute `start-yami.bat` no pendrive |
| Voz nao funciona | Verifique o microfone nas configuracoes do Windows |
| WhatsApp nao conecta | Escaneie o QR code no dashboard > Integracoes |
| Yami nao acorda | Certifique-se que o microfone esta ativo |

## Atualizacao

O Yami verifica atualizacoes automaticamente toda semana.
Para forcar: execute `YamiUpdater.ps1 -Check -Apply`

## Desinstalacao

1. Remova da inicializacao: Delete o atalho em `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Yami.lnk`
2. Remova tarefas agendadas: `powershell "Get-ScheduledTask -TaskName Yami-* | Unregister-ScheduledTask -Confirm:$false"`
3. Remova a pasta: `rm -r %USERPROFILE%\.yami`

## Suporte

- Dashboard: http://127.0.0.1:18808/
- Documentacao completa: `docs/` no pendrive
