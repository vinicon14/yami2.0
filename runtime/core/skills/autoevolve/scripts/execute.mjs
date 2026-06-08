#!/usr/bin/env node
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getEvolution, updateEvolution } from "./lib/registry.mjs";
import { executePrompt, executeBackground, getAvailableTools } from "./lib/executor.mjs";
import { loadConfig } from "./lib/config.mjs";
import { createSnapshot } from "./lib/rollback.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--id" && args[i + 1]) opts.id = args[++i];
    else if (args[i] === "--task" && args[i + 1]) opts.task = args[++i];
    else if (args[i] === "--tool" && args[i + 1]) opts.tool = args[++i];
    else if (args[i] === "--background") opts.background = true;
    else if (args[i] === "--all-tasks") opts.allTasks = true;
    else if (args[i] === "--help" || args[i] === "-h") opts.help = true;
  }
  return opts;
}

function showHelp() {
  console.log([
    "YAMI Autoevolucao - Execute v0.1.0",
    "",
    "Uso:",
    "  node execute.mjs --id <evolucao-id> --task <tarefa> --tool <ferramenta>",
    "",
    "Opcoes:",
    "  --id <id>              ID da evolução",
    "  --task <tarefa>        ID da tarefa (TASK-01, TASK-02, etc)",
    "  --tool <ferramenta>    Ferramenta: codex, claude, opencode",
    "  --background           Executar em background (nao esperar)",
    "  --all-tasks            Executar todas as tarefas (sequencial)",
    "  --help, -h             Mostra esta ajuda",
    "",
    "Exemplos:",
    "  node execute.mjs --id evol-abc123 --task TASK-03 --tool codex",
    "  node execute.mjs --id evol-abc123 --tool opencode --all-tasks",
    "  node execute.mjs --id evol-abc123 --task TASK-01 --background",
    "",
  ].join("\n"));
}

async function executeTask(evolutionId, taskId, tool, background = false) {
  const evolution = getEvolution(evolutionId);
  if (!evolution) {
    console.error(`Evolucao nao encontrada: ${evolutionId}`);
    process.exit(1);
  }
  const promptFile = join(evolution.outputDir, "prompts", `${tool}-${taskId}.md`);
  if (!existsSync(promptFile)) {
    console.error(`Prompt nao encontrado: ${promptFile}`);
    process.exit(1);
  }
  console.log(`\n  Executando ${taskId} com ${tool}...`);
  createSnapshot(evolutionId);
  if (background) {
    const result = await executeBackground(evolutionId, taskId, tool, promptFile, evolution.outputDir);
    console.log(`  Executando em background (PID: ${result.processId})`);
    console.log(`  Log: ${result.logFile}`);
    return result;
  } else {
    try {
      const result = await executePrompt(evolutionId, taskId, tool, promptFile);
      console.log(`  Status: ${result.status}`);
      console.log(`  Duracao: ${Math.round(result.duration / 1000)}s`);
      console.log(`  Log: ${result.logFile}`);
      return result;
    } catch (err) {
      console.error(`  Erro: ${err.message}`);
      throw err;
    }
  }
}

async function executeAllTasks(evolutionId, tool) {
  const evolution = getEvolution(evolutionId);
  if (!evolution) {
    console.error(`Evolucao nao encontrada: ${evolutionId}`);
    process.exit(1);
  }
  const tasks = ["TASK-01", "TASK-02", "TASK-03", "TASK-04", "TASK-05", "TASK-06"];
  let successCount = 0;
  let failCount = 0;
  for (const task of tasks) {
    try {
      await executeTask(evolutionId, task, tool, false);
      successCount++;
    } catch (err) {
      console.warn(`  Aviso: ${task} falhou, continuando...`);
      failCount++;
    }
  }
  console.log(`\n  Resumo: ${successCount} sucesso, ${failCount} falharam`);
  updateEvolution(evolutionId, {
    phase: "completed",
    status: failCount === 0 ? "implementado" : "parcial",
  });
}

async function run() {
  const opts = parseArgs();
  if (opts.help) {
    showHelp();
    process.exit(0);
  }
  if (!opts.id) {
    console.error("ERRO: --id eh obrigatorio. Use --help.");
    process.exit(1);
  }
  const tool = opts.tool || loadConfig().autoevolve.defaultTarget;
  if (opts.allTasks) {
    await executeAllTasks(opts.id, tool);
  } else if (opts.task) {
    await executeTask(opts.id, opts.task, tool, opts.background);
  } else {
    console.error("ERRO: Use --task ou --all-tasks. Use --help.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Erro na execucao:", err.message);
  process.exit(1);
});
