#!/usr/bin/env node

/**
 * YAMI Voice Listener Service
 * Listens for voice commands: "acorda" (wake up) and "descansa" (sleep)
 * Uses Windows native speech recognition
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class YAMIVoiceListener {
  constructor() {
    this.isListening = false;
    this.yamiProcess = null;
    this.recognitionEngine = null;
  }

  async start() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     YAMI Voice Listener Service v0.1.0     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('🎤 Ouvindo por comandos de voz...');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  • "acorda" - Inicia YAMI');
    console.log('  • "descansa" - Fecha YAMI');
    console.log('');
    console.log('Press Ctrl+C to stop listening');
    console.log('');
    console.log('─'.repeat(44));
    console.log('');

    this.isListening = true;
    this.initializeVoiceRecognition();
  }

  initializeVoiceRecognition() {
    // Create VBScript for Windows native speech recognition
    const vbsScript = this.createVBSRecognizer();
    const vbsPath = path.join(process.env.TEMP, 'yami-voice-recognizer.vbs');
    
    fs.writeFileSync(vbsPath, vbsScript);

    // Run the VBS recognizer
    this.startVoiceListener(vbsPath);
  }

  createVBSRecognizer() {
    return `
' YAMI Voice Recognition Script
Dim objSpRec, objReco, strText
Set objSpRec = CreateObject("SAPI.SpVoiceStatus")
Set objReco = CreateObject("SAPI.SpInprocRecognizer")

On Error Resume Next

Dim grammar
Set grammar = objReco.CreateGrammar(1)

' Define command words
grammar.AddWordTransition Nothing, Nothing, "acorda", " ", 1
grammar.AddWordTransition Nothing, Nothing, "descansa", " ", 1
grammar.AddWordTransition Nothing, Nothing, "acordar", " ", 1
grammar.AddWordTransition Nothing, Nothing, "descansar", " ", 1

objReco.SetNotifyWindowMessage "cmd", 8000, 0

Do While True
  Set objReco = CreateObject("SAPI.SpInprocRecognizer")
  objReco.AudioInput = CreateObject("SAPI.SpMMAudioIn")
  
  On Error Resume Next
  Set objCommand = objReco.CreateGrammar()
  
  Do While True
    objReco.Listen objCommand, 30
    
    If objReco.State = 3 Then ' SPRS_DONE
      strText = objReco.FinalResult.PhraseInfo.GetText()
      
      If InStr(1, strText, "acorda", 1) > 0 Or InStr(1, strText, "acordar", 1) > 0 Then
        WScript.Echo "VOICE_COMMAND:ACORDA"
        Exit Do
      End If
      
      If InStr(1, strText, "descansa", 1) > 0 Or InStr(1, strText, "descansar", 1) > 0 Then
        WScript.Echo "VOICE_COMMAND:DESCANSA"
        Exit Do
      End If
    End If
  Loop
Loop
`;
  }

  startVoiceListener(vbsPath) {
    // Start listening in loop
    const listener = spawn('cscript.exe', [vbsPath]);

    listener.stdout.on('data', (data) => {
      const output = data.toString().trim();
      
      if (output.includes('VOICE_COMMAND:ACORDA')) {
        console.log('✅ Comando detectado: ACORDA');
        this.handleAcorda();
        this.startVoiceListener(vbsPath); // Restart listener
      } else if (output.includes('VOICE_COMMAND:DESCANSA')) {
        console.log('✅ Comando detectado: DESCANSA');
        this.handleDescansa();
        this.startVoiceListener(vbsPath); // Restart listener
      }
    });

    listener.on('error', (error) => {
      console.error('❌ Erro no reconhecimento de voz:', error.message);
    });
  }

  handleAcorda() {
    console.log('🚀 Acordando YAMI...');
    
    if (this.yamiProcess) {
      console.log('⚠️  YAMI já está em execução!');
      return;
    }

    const cmd = process.platform === 'win32' ? 'cmd.exe' : 'bash';
    const args = process.platform === 'win32' 
      ? ['/k', 'C:\\Program Files\\YAMI\\bin\\yami.cmd']
      : ['-c', '/usr/local/bin/yami'];

    this.yamiProcess = spawn(cmd, args, {
      stdio: 'inherit',
      detached: true
    });

    console.log('✨ YAMI iniciado com sucesso!');
    console.log('');
    console.log('🎤 Continuando a ouvir por comandos de voz...');
    console.log('');
  }

  handleDescansa() {
    console.log('😴 Descansando YAMI...');
    
    if (this.yamiProcess) {
      this.yamiProcess.kill();
      this.yamiProcess = null;
      console.log('✨ YAMI encerrado com sucesso!');
    } else {
      // Kill any YAMI process
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'COMMANDLINE eq *yami*']);
        spawn('taskkill', ['/F', '/IM', 'cmd.exe', '/FI', 'WINDOWTITLE eq *YAMI*']);
      }
      console.log('✨ YAMI encerrado!');
    }
    
    console.log('');
    console.log('🎤 Continuando a ouvir por comandos de voz...');
    console.log('');
  }

  stop() {
    console.log('');
    console.log('Encerrando serviço de voz...');
    this.isListening = false;
    if (this.yamiProcess) {
      this.yamiProcess.kill();
    }
    process.exit(0);
  }
}

// Main execution
const listener = new YAMIVoiceListener();

process.on('SIGINT', () => {
  listener.stop();
});

listener.start().catch(error => {
  console.error('❌ Erro:', error.message);
  process.exit(1);
});
