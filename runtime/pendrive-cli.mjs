import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const pendrive = require("./pendrive-core.js");

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function printStatus(status) {
  console.log(`\n\x1b[36m=== YAMI PENDRIVE ===\x1b[0m`);
  console.log(`Caminho:    ${status.pendrivePath}`);
  console.log(`Inicializado: ${status.initialized ? "\x1b[32mSim\x1b[0m" : "\x1b[31mNao\x1b[0m"}`);
  if (status.identity) {
    console.log(`ID:         \x1b[33m${status.identity.yamiId}\x1b[0m`);
    console.log(`Instancia:  ${status.identity.instanceName}`);
    console.log(`Geracao:    ${status.identity.generation}`);
    console.log(`Criado em:  ${status.identity.createdAt}`);
  }
  if (status.evolution) {
    console.log(`Estagio:    ${status.evolution.currentStage}`);
    console.log(`Evolucoes:  ${status.evolution.totalEvolutions}`);
  }
  if (status.social) {
    console.log(`Amigos:     ${status.social.friends ? status.social.friends.total : 0}`);
    console.log(`Convites:   ${status.social.friends ? status.social.friends.incoming : 0} pendentes`);
    console.log(`Mensagens:  ${status.social.messages ? status.social.messages.totalMessages : 0} total, ${status.social.messages ? status.social.messages.unreadCount : 0} nao lidas`);
  }
  if (status.memory) {
    console.log(`Memorias:   ${status.memory.totalEntries}`);
  }
  console.log(``);
}

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "init": {
      const result = pendrive.initPendrive();
      console.log("\x1b[32mPendrive YAMI inicializado com sucesso.\x1b[0m");
      printStatus(result);
      break;
    }
    case "status":
    case "info": {
      const result = pendrive.getFullStatus();
      printStatus(result);
      break;
    }
    case "whoami": {
      const identity = pendrive.getIdentity();
      if (!identity) {
        console.log("\x1b[31mPendrive nao inicializado. Execute: yami pendrive init\x1b[0m");
        process.exit(1);
      }
      console.log(`\x1b[36m${identity.instanceName}\x1b[0m`);
      console.log(`ID: \x1b[33m${identity.yamiId}\x1b[0m`);
      console.log(`Geracao: ${identity.generation}`);
      break;
    }
    case "profile": {
      const sub = args[0];
      if (!sub) {
        const p = pendrive.getProfile();
        console.log(p ? JSON.stringify(p, null, 2) : "Perfil nao configurado.");
        break;
      }
      if (sub === "set") {
        const key = args[1];
        const value = args.slice(2).join(" ");
        if (!key || !value) {
          console.log("Uso: yami pendrive profile set <chave> <valor>");
          break;
        }
        const current = pendrive.getProfile() || {};
        current[key] = value;
        pendrive.saveProfile(current);
        console.log(`\x1b[32mPerfil atualizado: ${key} = ${value}\x1b[0m`);
      }
      break;
    }
    case "appearance": {
      const sub = args[0];
      if (!sub) {
        const a = pendrive.getAppearance();
        console.log(a ? JSON.stringify(a, null, 2) : "Aparencia padrao.");
        break;
      }
      if (sub === "set") {
        const key = args[1];
        const value = args.slice(2).join(" ");
        if (!key || !value) {
          console.log("Uso: yami pendrive appearance set <chave> <valor>");
          console.log("Chaves validas: glowColor, eyeStyle, eyeColor, mouthStyle, accessory, themePreset, bgEffect, brightness, scale, animationSet");
          break;
        }
        pendrive.setAppearance(key, value);
        console.log(`\x1b[32mAparencia atualizada: ${key} = ${value}\x1b[0m`);
      }
      if (sub === "theme") {
        const theme = args[1];
        if (!theme) {
          console.log("Uso: yami pendrive appearance theme <nome>");
          console.log("Temas: dark-neon, cyber-blue, sunset-amber, violet-haze, forest-green, midnight-ocean");
          break;
        }
        pendrive.setAppearance("themePreset", theme);
        console.log(`\x1b[32mTema alterado para: ${theme}\x1b[0m`);
      }
      if (sub === "accessory") {
        const acc = args[1];
        if (!acc) {
          console.log("Uso: yami pendrive appearance accessory <nome>");
          console.log("Acessorios: crown, headphones, glasses, scarf, bow, none");
          break;
        }
        pendrive.setAppearance("accessory", acc === "none" ? null : acc);
        console.log(`\x1b[32mAcessorio alterado para: ${acc}\x1b[0m`);
      }
      if (sub === "eyes") {
        const style = args[1];
        if (!style) {
          console.log("Uso: yami pendrive appearance eyes <estilo>");
          console.log("Estilos: default, happy, sleepy, cyborg, starry, fire");
          break;
        }
        pendrive.setAppearance("eyeStyle", style);
        console.log(`\x1b[32mEstilo dos olhos alterado para: ${style}\x1b[0m`);
      }
      if (sub === "glow") {
        const color = args[1];
        if (!color) {
          console.log("Uso: yami pendrive appearance glow <cor>");
          console.log("Cores: cyan, amber, green, red, violet, pink, blue");
          console.log("Ou valor RGB: 85, 230, 255");
          break;
        }
        const colorMap = { cyan: "85, 230, 255", amber: "255, 209, 102", green: "125, 247, 170", red: "255, 107, 122", violet: "177, 140, 255", pink: "255, 180, 200", blue: "70, 150, 255" };
        pendrive.setAppearance("glowColor", colorMap[color] || color);
        console.log(`\x1b[32mCor do glow alterada.\x1b[0m`);
      }
      break;
    }
    case "voice": {
      const sub = args[0];
      if (!sub) {
        const v = pendrive.getVoiceSettings();
        console.log(v ? JSON.stringify(v, null, 2) : "Voz padrao.");
        break;
      }
      if (sub === "set") {
        const key = args[1];
        const value = args.slice(2).join(" ");
        if (!key || !value) {
          console.log("Uso: yami pendrive voice set <chave> <valor>");
          console.log("Chaves: backend, voice, model, rate, volume");
          break;
        }
        const current = pendrive.getVoiceSettings() || {};
        current[key] = isNaN(Number(value)) ? value : Number(value);
        pendrive.saveVoiceSettings(current);
        console.log(`\x1b[32mVoz atualizada: ${key} = ${value}\x1b[0m`);
      }
      break;
    }
    case "evolution": {
      const sub = args[0];
      const evolution = pendrive.getEvolution();
      if (!sub) {
        console.log(evolution ? JSON.stringify({
          generation: evolution.generation,
          currentStage: evolution.currentStage,
          totalEvolutions: evolution.totalEvolutions,
          lastEvolutionAt: evolution.lastEvolutionAt,
          recentHistory: (evolution.history || []).slice(-5)
        }, null, 2) : "Evolucao nao iniciada.");
        break;
      }
      if (sub === "register") {
        const type = args[1] || "evolution";
        const desc = args.slice(2).join(" ") || "Evolucao registrada";
        pendrive.registerEvolution({ type, description: desc });
        console.log(`\x1b[32mEvolucao registrada: ${desc}\x1b[0m`);
      }
      if (sub === "stage") {
        const stageId = args[1];
        const stageName = args[2] || stageId;
        const stageDesc = args.slice(3).join(" ") || "";
        if (!stageId) {
          console.log("Uso: yami pendrive evolution stage <id> [nome] [descricao]");
          break;
        }
        pendrive.registerEvolution({ type: "stage-upgrade", description: `Evoluiu para ${stageName}`, newStage: stageId, stageName, stageDescription: stageDesc });
        console.log(`\x1b[32mNovo estagio: ${stageName}\x1b[0m`);
      }
      break;
    }
    case "friend":
    case "friends": {
      const sub = args[0];
      if (sub === "list") {
        const f = pendrive.getSocialFriends();
        if (f && f.friends.length > 0) {
          console.log("\x1b[36mAmigos YAMI:\x1b[0m");
          for (const friend of f.friends) {
            console.log(`  \x1b[33m${friend.displayName}\x1b[0m <${friend.yamiId}>`);
          }
        } else {
          console.log("Nenhum amigo adicionado.");
        }
        console.log(`Convites recebidos: ${(f && f.pendingIncoming || []).length}`);
        console.log(`Convites enviados: ${(f && f.pendingOutgoing || []).length}`);
        break;
      }
      if (sub === "add") {
        const friendId = args[1];
        const friendName = args[2] || friendId;
        if (!friendId) {
          console.log("Uso: yami pendrive friends add <yamiId> [nome]");
          break;
        }
        const result = pendrive.addFriend(friendId, friendName);
        console.log(result.ok ? `\x1b[32m${result.message}\x1b[0m` : `\x1b[31m${result.message}\x1b[0m`);
        break;
      }
      if (sub === "remove") {
        const friendId = args[1];
        if (!friendId) {
          console.log("Uso: yami pendrive friends remove <yamiId>");
          break;
        }
        pendrive.removeFriend(friendId);
        console.log("\x1b[32mAmigo removido.\x1b[0m");
        break;
      }
      if (sub === "invite") {
        const friendId = args[1];
        const msg = args.slice(2).join(" ") || "";
        if (!friendId) {
          console.log("Uso: yami pendrive friends invite <yamiId> [mensagem]");
          break;
        }
        pendrive.sendFriendRequest(friendId, msg);
        console.log("\x1b[32mConvite enviado.\x1b[0m");
        break;
      }
      if (sub === "accept") {
        const friendId = args[1];
        if (!friendId) {
          console.log("Uso: yami pendrive friends accept <yamiId>");
          break;
        }
        const result = pendrive.acceptFriendRequest(friendId);
        console.log(result.ok ? `\x1b[32m${result.message}\x1b[0m` : `\x1b[31m${result.message}\x1b[0m`);
        break;
      }
      if (sub === "requests") {
        const f = pendrive.getSocialFriends();
        if (f && f.pendingIncoming.length > 0) {
          console.log("\x1b[36mConvites pendentes:\x1b[0m");
          for (const req of f.pendingIncoming) {
            console.log(`  \x1b[33m${req.yamiId}\x1b[0m - ${req.message || "sem mensagem"}`);
          }
        } else {
          console.log("Nenhum convite pendente.");
        }
        break;
      }
      break;
    }
    case "card":
    case "profile-card": {
      const sub = args[0];
      if (sub === "generate" || !sub) {
        const card = pendrive.generateProfileCard();
        console.log("\x1b[32mCartao de perfil gerado:\x1b[0m");
        console.log(JSON.stringify(card, null, 2));
        break;
      }
      if (sub === "show") {
        const card = pendrive.getProfileCard();
        console.log(card ? JSON.stringify(card, null, 2) : "Nenhum cartao gerado.");
        break;
      }
      break;
    }
    case "message":
    case "messages": {
      const sub = args[0];
      if (sub === "send") {
        const to = args[1];
        const text = args.slice(2).join(" ");
        if (!to || !text) {
          console.log("Uso: yami pendrive messages send <yamiId> <texto>");
          break;
        }
        pendrive.sendMessage(to, text);
        console.log("\x1b[32mMensagem enviada.\x1b[0m");
        break;
      }
      if (sub === "list" || !sub) {
        const allMsgs = pendrive.getMessages(args[1] || "");
        const withFriend = args[1];
        if (withFriend) {
          const msgs = pendrive.getMessages(withFriend);
          for (const m of msgs) {
            const dir = m.direction === "incoming" ? "\x1b[33m<<\x1b[0m" : "\x1b[36m>>\x1b[0m";
            console.log(`${dir} ${m.text} [${m.timestamp}]`);
          }
        } else {
          const f = pendrive.getSocialFriends();
          if (f) {
            for (const friend of f.friends) {
              const msgs = pendrive.getMessages(friend.yamiId);
              if (msgs.length > 0) {
                console.log(`\x1b[36m${friend.displayName}:\x1b[0m ${msgs.length} mensagens`);
              }
            }
          }
        }
        break;
      }
      break;
    }
    case "memory": {
      const sub = args[0];
      if (sub === "add") {
        const content = args.slice(1).join(" ");
        if (!content) {
          console.log("Uso: yami pendrive memory add <conteudo>");
          break;
        }
        pendrive.addMemoryEntry("note", content);
        console.log("\x1b[32mMemoria adicionada.\x1b[0m");
        break;
      }
      if (sub === "search") {
        const query = args.slice(1).join(" ");
        if (!query) {
          console.log("Uso: yami pendrive memory search <termo>");
          break;
        }
        const results = pendrive.searchMemory(query);
        if (results.length > 0) {
          console.log(`\x1b[36m${results.length} memorias encontradas:\x1b[0m`);
          for (const r of results) {
            console.log(`  \x1b[33m[${r.type}]\x1b[0m ${r.content.slice(0, 120)}`);
          }
        } else {
          console.log("Nenhuma memoria encontrada.");
        }
        break;
      }
      if (sub === "list" || !sub) {
        const mem = pendrive.getMemoryEntries();
        if (mem && mem.entries.length > 0) {
          console.log(`\x1b[36m${mem.entries.length} memorias:\x1b[0m`);
          for (const e of mem.entries.slice(-20)) {
            console.log(`  \x1b[33m[${e.type}]\x1b[0m ${e.content.slice(0, 120)}`);
          }
        } else {
          console.log("Nenhuma memoria registrada.");
        }
        break;
      }
      break;
    }
    case "export": {
      const bundle = pendrive.getExportBundle();
      console.log(JSON.stringify(bundle, null, 2));
      break;
    }
    case "sync": {
      pendrive.recordSync();
      const s = pendrive.getSync();
      console.log(`\x1b[32mSincronizado em ${s.lastSyncAt}\x1b[0m`);
      console.log(`Host: ${s.lastHostName}`);
      break;
    }
    case "style":
    case "writing-style": {
      const sub = args[0];
      if (sub === "profile" || !sub) {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        const summary = engine.getWritingProfileSummary();
        if (summary && (summary.formality || summary.tone || summary.topGreeting)) {
          console.log("\x1b[36mPerfil de Estilo de Escrita:\x1b[0m");
          if (summary.formality) {
            console.log(`  Formalidade: \x1b[33m${summary.formality.value}\x1b[0m (confiança: ${Math.round(summary.formality.confidence * 100)}%)`);
          }
          if (summary.tone) {
            console.log(`  Tom predominante: \x1b[33m${summary.tone.value}\x1b[0m (confiança: ${Math.round(summary.tone.confidence * 100)}%)`);
          }
          if (summary.vocabularyLevel) {
            console.log(`  Nível de vocabulário: \x1b[33m${summary.vocabularyLevel.value}\x1b[0m`);
          }
          if (summary.sentenceStructure) {
            console.log(`  Estrutura de frases: \x1b[33m${summary.sentenceStructure.value}\x1b[0m`);
          }
          if (summary.avgMessageLength) {
            console.log(`  Comprimento médio: \x1b[33m${summary.avgMessageLength} caracteres\x1b[0m`);
          }
          if (summary.topGreeting) {
            console.log(`  Cumprimento típico: \x1b[33m"${summary.topGreeting}"\x1b[0m`);
          }
          if (summary.topSignoff) {
            console.log(`  Encerramento típico: \x1b[33m"${summary.topSignoff}"\x1b[0m`);
          }
          if (summary.topExpressions && summary.topExpressions.length > 0) {
            console.log(`  Expressões recorrentes: \x1b[33m${summary.topExpressions.slice(0, 3).join(", ")}\x1b[0m`);
          }
          console.log(`\n  Mensagens analisadas: ${summary.totalMessages}`);
          console.log(`  Confiança geral: ${Math.round(summary.confidence * 100)}%`);
          if (summary.enabled === false) {
            console.log("\n  ℹ Perfil de estilo \x1b[31mdesativado\x1b[0m");
          }
        } else {
          console.log("Nenhum perfil de estilo estabelecido ainda.");
        }
        break;
      }
      if (sub === "instructions" || sub === "guide") {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        const instructions = engine.getWritingStyleInstructions();
        if (instructions) {
          console.log("\x1b[36mInstruções de Estilo:\x1b[0m\n" + instructions);
        } else {
          console.log("Instruções de estilo ainda não disponíveis.");
        }
        break;
      }
      if (sub === "reset") {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        engine.resetWritingProfile();
        console.log("\x1b[32mPerfil de estilo reiniciado.\x1b[0m");
        break;
      }
      if (sub === "enable") {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        engine.setWritingStyleEnabled(true);
        console.log("\x1b[32mPerfil de estilo ativado.\x1b[0m");
        break;
      }
      if (sub === "disable") {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        engine.setWritingStyleEnabled(false);
        console.log("\x1b[32mPerfil de estilo desativado.\x1b[0m");
        break;
      }
      if (sub === "hints" || sub === "tips") {
        const { LearningEngine } = await import("../learning-engine/index.mjs");
        const engine = new LearningEngine({ baseDir: path.join(process.env.YAMI_HOME || ".", ".yami", "learning-engine") }).initialize();
        const hints = engine.getWritingStyleAdaptationHints();
        if (hints && hints.length > 0) {
          console.log("\x1b[36mDicas de Adaptação:\x1b[0m");
          for (const hint of hints) {
            const icon = hint.priority === "success" ? "✓" : hint.priority === "warning" ? "⚠" : "ℹ";
            console.log(`  ${icon} ${hint.message}`);
          }
        } else {
          console.log("Nenhuma dica disponível no momento.");
        }
        break;
      }
      break;
    }
    case "help":
    default:
      console.log(`
\x1b[36mYAMI PENDRIVE - Nucleo de Identidade, Evolucao e Rede Social\x1b[0m

Uso: node pendrive-cli.mjs <comando> [args]

Comandos:
  init                    Inicializa o pendrive YAMI
  status                  Status completo do pendrive
  whoami                  Mostra identidade atual

  profile                 Mostra perfil
  profile set <k> <v>     Altera campo do perfil

  appearance              Mostra aparencia
  appearance set <k> <v>  Altera aparencia (glowColor, eyeStyle, eyeColor, etc)
  appearance theme <nome> Altera tema visual
  appearance accessory    Altera acessorio (crown, headphones, glasses, etc)
  appearance eyes <estilo> Altera estilo dos olhos
  appearance glow <cor>   Altera cor do glow

  voice                   Mostra config de voz
  voice set <k> <v>       Altera config de voz

  evolution               Historico de evolucao
  evolution register <tipo> <desc>  Registra evolucao
  evolution stage <id> [nome]       Avanca para novo estagio

  friends list            Lista amigos
  friends add <id> [nome] Adiciona amigo
  friends remove <id>     Remove amigo
  friends invite <id>     Envia convite
  friends accept <id>     Aceita convite
  friends requests        Lista convites pendentes

  card [generate]         Gera/mostra cartao de perfil
  card show               Mostra cartao atual

  messages send <id> <texto>  Envia mensagem
  messages list [id]          Lista mensagens

  memory [list]           Lista memorias
  memory add <texto>      Adiciona memoria
  memory search <termo>   Busca na memoria

   export                  Exporta bundle de identidade
   sync                    Marca sincronizacao

   style [profile]         Mostra perfil de estilo de escrita
   style instructions      Mostra instruções de estilo
   style hints             Mostra dicas de adaptação
   style enable            Ativa análise de estilo
   style disable           Desativa análise de estilo
   style reset             Redefine perfil de estilo

   help                    Mostra esta ajuda
`);
  }
}

main().catch((err) => {
  console.error("\x1b[31mErro:\x1b[0m", err.message);
  process.exit(1);
});
