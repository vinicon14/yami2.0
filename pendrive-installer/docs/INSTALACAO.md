# Yami - Documentacao Completa de Instalacao

## Instalacao por Pendrive (Plug-and-Play)

O metodo mais simples e recomendado.

### Passo a Passo

1. **Conecte o pendrive** Yami ao computador.
2. **Autorun** abre automaticamente o instalador.
   - Se nao abrir, execute `installer\YamiInstaller.exe` manualmente.
3. **Assistente de Configuracao**:
   - **Conta OpenAI**: Insira sua chave de API (necessaria para o cerebro IA).
   - **WhatsApp**: Opcional - conecte para respostas automaticas.
   - **Google**: Opcional - para agenda, fotos e arquivos.
   - **Permissoes**: Autorize microfone, auto-start e notificacoes.
4. **Instalacao Automatica**: O Yami copia todos os arquivos, configura o runtime e prepara o ambiente.
5. **Pronto!** O Tamagotchi Yami aparece na tela.

### O que e Instalado

- `%USERPROFILE%\.yami\` - Home do Yami
  - `runtime\core\` - Motor Yami
  - `auto-panel\` - Dashboard e controle
  - `yami.json` - Configuracao principal
  - `updater\` - Sistema de atualizacao
  - `modules\` - Registro de modulos
- Atalho em Inicializar do Windows
- Tarefa agendada de atualizacao semanal

## Instalacao Manual (sem pendrive)

1. Instale Node.js 22+ de https://nodejs.org/
2. Clone ou copie os arquivos do Yami para `%USERPROFILE%\.yami\`
3. Execute:
   ```
   cd %USERPROFILE%\.yami\runtime\core
   npm install
   ```
4. Execute o dashboard:
   ```
   node %USERPROFILE%\.yami\auto-panel\server.js
   ```
5. Abra http://127.0.0.1:18808/

## Personalizacao Pos-Instalacao

### Tamagotchi
- Acesse o Dashboard > Configuracoes > Aparencia
- Customize: cor do glow, olhos, boca, acessorios, animacoes

### Voz
- Dashboard > Voz Yami
- Backend: Windows padrao, pyttsx3, ou Piper TTS
- Velocidade e volume ajustaveis

### WhatsApp
- Dashboard > Integracoes > WhatsApp
- Escaneie o QR code para conectar

### Auto-Evolucao
- O Yami pode evoluir sozinho com o modulo autoevolve
- Ative em: Dashboard > Automacoes

## Atualizacao

### Automatica
- O Yami verifica atualizacoes toda semana (domingo 03:00)
- E ao iniciar o computador

### Manual
- Execute: `updater\YamiUpdater.ps1 -Check -Apply`
- Ou conecte um pendrive com versao mais recente

### Verificar versao
```
%USERPROFILE%\.yami\VERSION
```
Ou no Dashboard > Sistema
