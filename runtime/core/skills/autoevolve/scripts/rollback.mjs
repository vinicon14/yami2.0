#!/usr/bin/env node
import { getEvolution } from "./lib/registry.mjs";
import { revertToPhase, createSnapshot } from "./lib/rollback.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cmd: "help" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--id" && args[i + 1]) opts.id = args[++i];
    else if (args[i] === "--to" && args[i + 1]) opts.to = args[++i];
    else if (args[i] === "--snapshot") opts.cmd = "snapshot";
    else if (args[i] === "--revert") opts.cmd = "revert";
    else if (args[i] === "--help" || args[i] === "-h") opts.help = true;
  }
  return opts;
}

function showHelp() {
  console.log([
    "YAMI Autoevolucao - Rollback v0.1.0",
    "",
    "Uso:",
    "  node rollback.mjs --id <evolucao-id> --snapshot          # Criar snapshot",
    "  node rollback.mjs --id <evolucao-id> --revert --to <fase>  # Reverter para fase",
    "",
    "Opcoes:",
    "  --id <id>              ID da evolução",
    "  --snapshot             Criar snapshot do estado atual",
    "  --revert               Reverter para uma fase anterior",
    "  --to <fase>            Fase alvo (spec, planning, implementation, testing, validation, integration)",
    "  --help, -h             Mostra esta ajuda",
    "",
    "Exemplos:",
    "  node rollback.mjs --id evol-abc123 --snapshot",
    "  node rollback.mjs --id evol-abc123 --revert --to planning",
    "",
  ].join("\n"));
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
  const evolution = getEvolution(opts.id);
  if (!evolution) {
    console.error(`Evolucao nao encontrada: ${opts.id}`);
    process.exit(1);
  }
  if (opts.cmd === "snapshot") {
    console.log(`\n  Criando snapshot da evolucao ${opts.id}...`);
    const snapshotDir = createSnapshot(opts.id);
    console.log(`  Snapshot criado: ${snapshotDir}`);
    console.log(`  Status atual: ${evolution.status}`);
    console.log(`  Fase atual: ${evolution.phase}`);
  } else if (opts.cmd === "revert") {
    if (!opts.to) {
      console.error("ERRO: --to eh obrigatorio para revert. Use --help.");
      process.exit(1);
    }
    console.log(`\n  Revertendo evolucao ${opts.id} para fase ${opts.to}...`);
    try {
      const result = revertToPhase(opts.id, opts.to);
      console.log(`  ${result.message}`);
      console.log(`  Backup anterior criado em: ${result.backupCreatedAt}`);
    } catch (err) {
      console.error(`  Erro: ${err.message}`);
      process.exit(1);
    }
  } else {
    showHelp();
  }
}

run().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
