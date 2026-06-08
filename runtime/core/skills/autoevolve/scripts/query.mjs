#!/usr/bin/env node
import { listEvolutions, getEvolution, getStats } from "./lib/registry.mjs";
import { loadConfig } from "./lib/config.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cmd: "list" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--status" && args[i + 1]) opts.status = args[++i];
    else if (args[i] === "--category" && args[i + 1]) opts.category = args[++i];
    else if (args[i] === "--phase" && args[i + 1]) opts.phase = args[++i];
    else if (args[i] === "--search" && args[i + 1]) opts.search = args[++i];
    else if (args[i] === "--id" && args[i + 1]) opts.id = args[++i];
    else if (args[i] === "--stats") opts.cmd = "stats";
    else if (args[i] === "--json") opts.json = true;
    else if (args[i] === "--help" || args[i] === "-h") opts.help = true;
    else if (!args[i].startsWith("--")) opts.cmd = args[i];
  }
  return opts;
}

function formatTable(evolutions) {
  if (evolutions.length === 0) {
    console.log("Nenhuma evolucao encontrada.");
    return;
  }
  console.log("\n┌─────────────────────┬──────────────┬─────────┬──────────┬──────────────┐");
  console.log("│ ID                  │ Categoria    │ Status  │ Fase     │ Criada em    │");
  console.log("├─────────────────────┼──────────────┼─────────┼──────────┼──────────────┤");
  for (const e of evolutions.slice(0, 20)) {
    const id = e.id.slice(0, 19).padEnd(19);
    const cat = (e.category || "?").slice(0, 12).padEnd(12);
    const status = (e.status || "?").slice(0, 7).padEnd(7);
    const phase = (e.phase || "?").slice(0, 8).padEnd(8);
    const created = new Date(e.createdAt).toLocaleString("pt-BR").slice(0, 12).padEnd(12);
    console.log(`│ ${id} │ ${cat} │ ${status} │ ${phase} │ ${created} │`);
  }
  console.log("└─────────────────────┴──────────────┴─────────┴──────────┴──────────────┘");
  if (evolutions.length > 20) {
    console.log(`\n... e mais ${evolutions.length - 20} evolucoes. Use --search ou --status para filtrar.`);
  }
}

function showEvolutionDetail(id) {
  const evolution = getEvolution(id);
  if (!evolution) {
    console.error(`Evolucao nao encontrada: ${id}`);
    process.exit(1);
  }
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                   DETALHES DA EVOLUÇÃO                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log(`ID:                  ${evolution.id}`);
  console.log(`Status:              ${evolution.status}`);
  console.log(`Categoria:           ${evolution.category}`);
  console.log(`Fase:                ${evolution.phase}`);
  console.log(`Tarefas:             ${evolution.taskCount}`);
  console.log(`Score validacao:     ${evolution.validationScore}%`);
  console.log(`Criada em:           ${new Date(evolution.createdAt).toLocaleString("pt-BR")}`);
  console.log(`Atualizada em:       ${new Date(evolution.updatedAt).toLocaleString("pt-BR")}`);
  console.log(`Diretorio:           ${evolution.outputDir}`);
  console.log(`Tags:                ${evolution.tags?.join(", ") || "nenhuma"}`);
  console.log(`\nRequisicao:`);
  console.log(`  ${evolution.request}`);
  console.log("");
}

function showStats() {
  const stats = getStats();
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    ESTATÍSTICAS                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log(`Total de evoluções:        ${stats.total}`);
  console.log(`Score médio validacao:     ${stats.averageValidationScore}%`);
  console.log(`Mais recente:              ${stats.newestEvolution ? new Date(stats.newestEvolution).toLocaleString("pt-BR") : "nenhuma"}`);
  console.log(`Mais antiga:                ${stats.oldestEvolution ? new Date(stats.oldestEvolution).toLocaleString("pt-BR") : "nenhuma"}`);
  console.log(`\nPor Status:`);
  for (const [status, count] of Object.entries(stats.byStatus)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`\nPor Categoria:`);
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log(`\nPor Fase:`);
  for (const [phase, count] of Object.entries(stats.byPhase)) {
    console.log(`  ${phase}: ${count}`);
  }
  console.log("");
}

function showHelp() {
  console.log([
    "YAMI Autoevolucao - Query v0.1.0",
    "",
    "Uso:",
    "  node query.mjs [comando] [opcoes]",
    "",
    "Comandos:",
    "  list       Lista evoluções (padrão)",
    "  stats      Mostra estatísticas",
    "  <id>       Detalhes de uma evolução",
    "",
    "Opcoes:",
    "  --status <valor>      Filtrar por status (gerado, implementado, validado, integrado)",
    "  --category <valor>    Filtrar por categoria",
    "  --phase <valor>       Filtrar por fase (spec, planning, implementation, etc)",
    "  --search <texto>      Buscar no texto da requisição",
    "  --json                Saida em JSON",
    "  --help, -h            Mostra esta ajuda",
    "",
    "Exemplos:",
    "  node query.mjs list --status gerado",
    "  node query.mjs evol-abc123-xyz",
    "  node query.mjs stats",
    "  node query.mjs --search Google --category integration",
    "",
  ].join("\n"));
}

async function run() {
  const opts = parseArgs();
  if (opts.help) {
    showHelp();
    process.exit(0);
  }
  if (opts.cmd === "stats") {
    showStats();
  } else if (opts.id) {
    showEvolutionDetail(opts.id);
  } else if (opts.cmd === "list") {
    const evolutions = listEvolutions({
      status: opts.status,
      category: opts.category,
      phase: opts.phase,
      search: opts.search,
    });
    if (opts.json) {
      console.log(JSON.stringify(evolutions, null, 2));
    } else {
      formatTable(evolutions);
    }
  } else {
    showEvolutionDetail(opts.cmd);
  }
}

run().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
