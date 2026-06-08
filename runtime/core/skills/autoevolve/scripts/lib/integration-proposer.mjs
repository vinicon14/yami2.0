import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function proposeIntegration(spec, category, tasks, outputDir) {
  const integrationDir = join(outputDir, "integracao");
  if (!existsSync(integrationDir)) mkdirSync(integrationDir, { recursive: true });
  const steps = [
    {
      step: 1,
      action: "Registrar skill no yami.json",
      description: `Adicionar entrada em skills.entries.${category?.id || "new-module"} com enabled: true`,
      file: "yami.json",
      code: `"${category?.id || "new-module"}": { "enabled": true }`,
    },
    {
      step: 2,
      action: "Registrar modulo no yami-manifest.json",
      description: "Adicionar entrada em coreModules com status e proposito",
      file: "runtime/yami-manifest.json",
      code: JSON.stringify({
        id: category?.id || "new-module",
        name: getModuleName(category),
        status: "scaffolded",
        purpose: spec.slice(0, 80),
      }, null, 2),
    },
    {
      step: 3,
      action: "Criar estrutura de diretorios",
      description: `Criar runtime/core/skills/${category?.id || "new-module"}/ com SKILL.md, scripts/ e assets/`,
      file: `runtime/core/skills/${category?.id || "new-module"}/`,
    },
    {
      step: 4,
      action: "Gerar documentacao inicial",
      description: "Criar documentacao basica do modulo",
      file: "docs/",
    },
    {
      step: 5,
      action: "Atualizar CHANGELOG",
      description: "Registrar a nova funcionalidade no changelog do YAMI",
      file: "runtime/core/CHANGELOG.md",
    },
    {
      step: 6,
      action: "Testar integracao",
      description: "Validar que o registro e carregamento do modulo funcionam",
      file: "testes/",
    },
  ];
  const proposal = {
    id: `integracao-${category?.id || "new"}`,
    title: `Proposta de integracao: ${category?.label || "Novo modulo"}`,
    generatedAt: new Date().toISOString(),
    steps,
    checklist: steps.map((s) => ({ ...s, done: false })),
    manifest: {
      yamiJson: steps[0].code,
      manifestEntry: JSON.parse(steps[1].code),
    },
  };
  writeFileSync(join(integrationDir, "proposal.json"), JSON.stringify(proposal, null, 2), "utf8");
  const md = [
    "# Proposta de Integracao",
    "",
    `**Modulo:** ${category?.label || "Novo modulo"}`,
    `**Gerado em:** ${proposal.generatedAt}`,
    "",
    "## Passos para integracao",
    "",
    ...steps.map((s) => `### ${s.step}. ${s.action}\n\n${s.description}\n\nArquivo: \`${s.file}\`\n${s.code ? `\n\`\`\`json\n${s.code}\n\`\`\`\n` : ""}`),
    "",
    "## Checklist",
    "",
    ...steps.map((s) => `- [ ] ${s.step}. ${s.action}`),
    "",
  ].join("\n");
  writeFileSync(join(integrationDir, "proposal.md"), md, "utf8");
  return proposal;
}

function getModuleName(category) {
  const names = {
    integration: "Integracao",
    feature: "Funcionalidade",
    automation: "Automacao",
    agent: "Agente Interno",
    ui: "Interface",
    productivity: "Produtividade",
    voice: "Voz",
    sync: "Sincronizacao",
    other: "Modulo",
  };
  return names[category?.id] || "Modulo";
}

export { proposeIntegration };
