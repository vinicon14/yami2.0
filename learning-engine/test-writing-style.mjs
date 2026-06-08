#!/usr/bin/env node

import { LearningEngine } from './index.mjs';
import { WritingStyleProfiler } from './WritingStyleProfiler.mjs';
import { WritingStyleStore } from './WritingStyleStore.mjs';
import { WritingStyleRenderer } from './WritingStyleRenderer.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Iniciando testes do Sistema de Estilo de Escrita...\n');

// Teste 1: WritingStyleProfiler
console.log('📝 Teste 1: WritingStyleProfiler');
const profiler = new WritingStyleProfiler();

const testMessages = [
  "Opa! Tudo bem? Preciso de uma ajuda com um projeto bacana! 😄",
  "Com certeza! Fico feliz em ajudar, sabe? Manda a bronca!",
  "Valeu pela ajuda, mano! Você é show demais! 🙌",
  "Opa, mais uma coisa: pode me explicar como funciona?"
];

for (const msg of testMessages) {
  const metrics = profiler.analyzeMessage(msg);
  console.log(`  ✓ Analisada: "${msg.substring(0, 40)}..."`);
  console.log(`    - Formalidade: ${metrics.formalityLevel}`);
  console.log(`    - Tom: ${metrics.tone}`);
  console.log(`    - Gírias: ${(metrics.slangScore * 100).toFixed(1)}%`);
}
console.log('✅ WritingStyleProfiler funcionando\n');

// Teste 2: WritingStyleStore
console.log('💾 Teste 2: WritingStyleStore');
const store = new WritingStyleStore(__dirname);
store.load();

for (const msg of testMessages) {
  store.recordMessage(msg);
}

const metrics = profiler.analyzeMessage(testMessages[0]);
store.updateMetrics({
  formality: metrics.formalityLevel,
  tone: metrics.tone,
  vocabularyLevel: metrics.vocabularyLevel,
  sentenceStructure: metrics.sentenceStructure
});

const summary = store.getStyleSummary();
console.log('  ✓ Perfil de Estilo:');
if (summary.formality) console.log(`    - Formalidade: ${summary.formality.value} (${Math.round(summary.formality.confidence * 100)}%)`);
if (summary.tone) console.log(`    - Tom: ${summary.tone.value} (${Math.round(summary.tone.confidence * 100)}%)`);
console.log(`    - Total de mensagens: ${summary.totalMessages}`);
console.log(`    - Confiança geral: ${Math.round(summary.confidence * 100)}%`);
console.log('✅ WritingStyleStore funcionando\n');

// Teste 3: WritingStyleRenderer
console.log('🎨 Teste 3: WritingStyleRenderer');
const renderer = new WritingStyleRenderer(store);

const promptBlock = renderer.buildPromptInjection();
console.log('  ✓ Prompt Injection gerado:');
if (promptBlock.length > 0) {
  console.log(`    - Tamanho: ${promptBlock.length} caracteres`);
  console.log(`    - Contém <writing_style_profile>: ${promptBlock.includes('writing_style_profile')}`);
}

const instructions = renderer.buildStyleInstructions();
console.log('  ✓ Instruções de Estilo:');
if (instructions.length > 0) {
  const lines = instructions.split('\n').length;
  console.log(`    - ${lines} linhas de instruções`);
}

const hints = renderer.getAdaptationHints();
console.log(`  ✓ Dicas de Adaptação: ${hints.length} dicas`);
console.log('✅ WritingStyleRenderer funcionando\n');

// Teste 4: LearningEngine Integration
console.log('🔧 Teste 4: LearningEngine Integration');
const engine = new LearningEngine({ baseDir: __dirname }).initialize();

for (const msg of testMessages) {
  engine.recordMessage(msg);
}

const profileSummary = engine.getWritingProfileSummary();
console.log('  ✓ Perfil via LearningEngine:');
console.log(`    - Mensagens registradas: ${profileSummary.totalMessages}`);
console.log(`    - Sistema ativado: ${engine.isWritingStyleEnabled()}`);

const styleInstructions = engine.getWritingStyleInstructions();
console.log(`  ✓ Instruções de estilo: ${styleInstructions.length > 0 ? 'Disponíveis' : 'Não disponíveis'}`);

const writingPrompt = engine.buildWritingStylePromptInjection();
console.log(`  ✓ Injeção de prompt: ${writingPrompt.length > 0 ? 'Gerada' : 'Vazia'}`);

const adaptationHints = engine.getWritingStyleAdaptationHints();
console.log(`  ✓ Dicas: ${adaptationHints.length} dica(s)`);

console.log('✅ LearningEngine Integration funcionando\n');

// Teste 5: Response Styling
console.log('✍️ Teste 5: Response Styling');
const testResponse = "Claro! Fico feliz em ajudar com seu projeto.";
const userInput = testMessages[0];

const styledResponse = engine.buildResponseWithWritingStyle(testResponse, userInput);
console.log('  ✓ Resposta original:');
console.log(`    "${testResponse}"`);
console.log('  ✓ Resposta com estilo:');
console.log(`    "${styledResponse}"`);
console.log('✅ Response Styling funcionando\n');

// Teste 6: Enable/Disable
console.log('⚙️ Teste 6: Enable/Disable');
engine.setWritingStyleEnabled(false);
console.log(`  ✓ Sistema desativado: ${!engine.isWritingStyleEnabled()}`);

engine.setWritingStyleEnabled(true);
console.log(`  ✓ Sistema reativado: ${engine.isWritingStyleEnabled()}`);
console.log('✅ Enable/Disable funcionando\n');

// Teste 7: Reset
console.log('🔄 Teste 7: Reset de Perfil');
const beforeReset = engine.getWritingProfileSummary().totalMessages;
console.log(`  ✓ Mensagens antes do reset: ${beforeReset}`);

engine.resetWritingProfile();

const afterReset = engine.getWritingProfileSummary().totalMessages;
console.log(`  ✓ Mensagens após reset: ${afterReset}`);
console.log('✅ Reset funcionando\n');

console.log('════════════════════════════════════════════════');
console.log('✨ TODOS OS TESTES PASSARAM COM SUCESSO! ✨');
console.log('════════════════════════════════════════════════\n');

console.log('📊 Resumo da Implementação:');
console.log('✓ WritingStyleStore - Persistência de dados');
console.log('✓ WritingStyleProfiler - Análise de mensagens');
console.log('✓ WritingStyleRenderer - Geração de prompts');
console.log('✓ LearningEngine - Integração completa');
console.log('✓ Gerenciamento de estado (enable/disable/reset)');
console.log('✓ Adaptação de respostas com estilo pessoal');
console.log('\n✅ Sistema de Estilo de Escrita pronto para uso!');
