import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "templates");

function generateDocs(spec, category, tasks, outputDir) {
  const docsDir = join(outputDir, "docs");
  if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
  const moduleName = getDocModuleName(category);
  const docTemplate = readFileSync(join(TEMPLATE_DIR, "doc-template.md"), "utf8");
  const changelogTemplate = readFileSync(join(TEMPLATE_DIR, "changelog-template.md"), "utf8");
  const date = new Date().toISOString().split("T")[0];
  const basicDoc = docTemplate
    .replace(/\{\{MODULE_NAME\}\}/g, moduleName)
    .replace(/\{\{SUMMARY\}\}/g, `Modulo gerado pelo sistema de autoevolucao YAMI.\n\n${spec.slice(0, 200)}...`)
    .replace(/\{\{INSTALLATION\}\}/g, "1. Habilitar a skill em `yami.json`\n2. (Opcional) Configurar parametros no mesmo arquivo")
    .replace(/\{\{CONFIGURATION\}\}/g, "```json\n{\n  \"skills\": {\n    \"entries\": {\n      \"" + (category?.id || "new-module") + "\": {\n        \"enabled\": true\n      }\n    }\n  }\n}\n```")
    .replace(/\{\{USAGE\}\}/g, "Consulte a SKILL.md do modulo para instrucoes de uso detalhadas.")
    .replace(/\{\{COMMANDS\}\}/g, "Comandos disponiveis serao definidos durante a implementacao.")
    .replace(/\{\{YAMI_INTEGRATION\}\}/g, "Integrado como skill YAMI. Requer YAMI runtime 0.1.0+.")
    .replace(/\{\{EXAMPLES\}\}/g, "Exemplos serao adicionados apos a implementacao.")
    .replace(/\{\{CHANGELOG\}\}/g, `- ${date}: Versao inicial gerada via autoevolucao`);
  writeFileSync(join(docsDir, "README.md"), basicDoc, "utf8");
  const changes = tasks.map((t) => {
    return changelogTemplate
      .replace(/\{\{VERSION\}\}/g, "0.1.0")
      .replace(/\{\{DATE\}\}/g, date)
      .replace(/\{\{CATEGORY\}\}/g, t.phase.charAt(0).toUpperCase() + t.phase.slice(1))
      .replace(/\{\{ENTRY\}\}/g, `${t.id}: ${t.title}`);
  });
  const changelogContent = [
    "# Changelog",
    "",
    `## 0.1.0 (${date})`,
    "",
    "### Adicionado",
    "",
    `- Modulo ${moduleName} gerado via autoevolucao`,
    ...tasks.map((t) => `- ${t.id}: ${t.title}`),
    "",
  ].join("\n");
  writeFileSync(join(docsDir, "CHANGELOG.md"), changelogContent, "utf8");
  return { docPath: join(docsDir, "README.md"), changelogPath: join(docsDir, "CHANGELOG.md") };
}

function getDocModuleName(category) {
  const names = {
    integration: "Nova Integracao",
    feature: "Nova Funcionalidade",
    automation: "Automacao",
    agent: "Agente Interno",
    ui: "Interface",
    productivity: "Produtividade",
    voice: "Sistema de Voz",
    sync: "Sincronizacao",
    other: "Modulo YAMI",
  };
  return names[category?.id] || "Modulo YAMI";
}

export { generateDocs };
