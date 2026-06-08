#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSpec, classifyRequest } from "./lib/spec-generator.mjs";
import { createPlan } from "./lib/task-planner.mjs";
import { buildPrompts } from "./lib/prompt-builder.mjs";
import { recordEvolution, updateStatus } from "./lib/history.mjs";
import { validateOutput } from "./lib/validator.mjs";
import { generateDocs } from "./lib/documenter.mjs";
import { proposeIntegration } from "./lib/integration-proposer.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, "..");
const EVOLUCOES_DIR = join(SKILL_DIR, "evolucoes");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--request" && args[i + 1]) opts.request = args[++i];
    else if (args[i] === "--request-file" && args[i + 1]) {
      opts.request = readFileSync(args[++i], "utf8").trim();
    } else if (args[i] === "--outdir" && args[i + 1]) opts.outdir = args[++i];
    else if (args[i] === "--target" && args[i + 1]) opts.targets = args[++i].split(",");
    else if (args[i] === "--no-combined") opts.combined = false;
    else if (args[i] === "--help" || args[i] === "-h") opts.help = true;
    else if (args[i] === "--status" && args[i + 1]) opts.statusId = args[++i];
    else if (args[i] === "--status-value" && args[i + 1]) opts.statusValue = args[++i];
  }
  return opts;
}

function showHelp() {
  console.log([
    "YAMI Autoevolucao v0.1.0",
    "",
    "Uso:",
    "  node evolve.mjs --request \"<descricao da funcionalidade>\"",
    "  node evolve.mjs --request-file ./solicitacao.txt --target codex",
    "  node evolve.mjs --status <id> --status-value <novo status>",
    "",
    "Opcoes:",
    "  --request <texto>      Descricao da funcionalidade desejada",
    "  --request-file <path>  Arquivo com a descricao",
    "  --outdir <path>        Diretorio de saida (padrao: evolucoes/<id>)",
    "  --target <list>        Ferramenta alvo: codex,claude,opencode (padrao: todas)",
    "  --no-combined          Nao gerar prompts combinados",
    "  --status <id>          Atualizar status de uma evolucao",
    "  --status-value <val>   Novo status (gerado,implementado,validado,integrado)",
    "  --help, -h             Mostra esta ajuda",
    "",
    "Exemplos:",
    "  node evolve.mjs --request \"Criar integracao com Google Calendar\"",
    "  node evolve.mjs --request \"Adicionar suporte ao Spotify\" --target codex",
    "  node evolve.mjs --request \"Melhorar interface de voz\" --outdir ./minha-evolucao",
    "",
  ].join("\n"));
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function run() {
  const opts = parseArgs();
  if (opts.help) {
    showHelp();
    process.exit(0);
  }
  if (opts.statusId && opts.statusValue) {
    updateStatus(opts.statusId, opts.statusValue);
    console.log(`Status atualizado: ${opts.statusId} -> ${opts.statusValue}`);
    process.exit(0);
  }
  if (!opts.request) {
    console.error("ERRO: Use --request ou --request-file. Consulte --help.");
    process.exit(1);
  }
  console.log(`\n  YAMI Autoevolucao`);
  console.log(`  ================\n`);
  console.log(`  1. Analise: "${opts.request.slice(0, 100)}${opts.request.length > 100 ? "..." : ""}"`);
  const category = classifyRequest(opts.request);
  console.log(`     Categoria: ${category.label}`);
  console.log(`  2. Gerando especificacao tecnica...`);
  const { spec, id } = generateSpec(opts.request);
  const outputDir = opts.outdir || join(EVOLUCOES_DIR, id);
  ensureDir(outputDir);
  writeFileSync(join(outputDir, "spec.md"), spec, "utf8");
  console.log(`     -> ${join(outputDir, "spec.md")}`);
  console.log(`  3. Planejando tarefas de desenvolvimento...`);
  const { tasks } = createPlan(spec, category);
  const tasksJson = JSON.stringify({ id, request: opts.request, category, tasks }, null, 2);
  writeFileSync(join(outputDir, "tasks.json"), tasksJson, "utf8");
  console.log(`     -> ${join(outputDir, "tasks.json")}`);
  console.log(`     -> ${tasks.length} tarefas geradas`);
  for (const t of tasks) {
    console.log(`        ${t.id}: ${t.title}`);
  }
  console.log(`  4. Gerando prompts tecnicos estruturados...`);
  const promptManifest = buildPrompts(tasks, spec, outputDir, {
    targetIds: opts.targets,
    combined: opts.combined,
  });
  for (const [key, val] of Object.entries(promptManifest)) {
    console.log(`     -> ${key}: ${val.combined || "prompts individuais gerados"}`);
  }
  console.log(`  5. Executando validacao da saida...`);
  const validation = validateOutput(outputDir, { historyId: id });
  console.log(`     Status: ${validation.status} (${validation.score}% - ${validation.passed}/${validation.total} criterios)`);
  for (const r of validation.results) {
    console.log(`     ${r.passed ? "PASSOU" : "FALHOU"}: ${r.label}`);
  }
  console.log(`  6. Gerando documentacao automatica...`);
  const docs = generateDocs(spec, category, tasks, outputDir);
  console.log(`     -> ${docs.docPath}`);
  console.log(`     -> ${docs.changelogPath}`);
  console.log(`  7. Propondo integracao ao YAMI...`);
  const proposal = proposeIntegration(spec, category, tasks, outputDir);
  console.log(`     -> ${join(outputDir, "integracao", "proposal.md")}`);
  console.log(`     -> ${proposal.steps.length} passos para integracao`);
  console.log(`  8. Registrando no historico de evolucao...`);
  const historyEntry = recordEvolution({
    id,
    request: opts.request,
    category: category.label,
    status: "gerado",
    files: {
      spec: join(outputDir, "spec.md"),
      tasks: join(outputDir, "tasks.json"),
      prompts: join(outputDir, "prompts"),
      docs: docs.docPath,
      proposal: join(outputDir, "integracao", "proposal.md"),
    },
    outputDir,
  });
  console.log(`     -> ${id} registrado no historico`);
  console.log(`\n  Resumo:`);
  console.log(`  -------`);
  console.log(`  ID:        ${id}`);
  console.log(`  Saida:     ${outputDir}`);
  console.log(`  Categoria: ${category.label}`);
  console.log(`  Tarefas:   ${tasks.length}`);
  console.log(`  Validacao: ${validation.status} (${validation.score}%)`);
  console.log(`  Status:    ${historyEntry.status}`);
  console.log(`\n  Proximo passo: Implementar usando Codex, Claude Code ou OpenCode.`);
  console.log(`  Use os prompts em: ${join(outputDir, "prompts")}\n`);
}

run().catch((err) => {
  console.error("Erro no ciclo de evolucao:", err);
  process.exit(1);
});
