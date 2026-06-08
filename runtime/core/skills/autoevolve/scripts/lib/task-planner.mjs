import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "templates");

const TASK_PHASES = [
  { id: "analysis", label: "Analise", order: 1 },
  { id: "planning", label: "Planejamento", order: 2 },
  { id: "implementation", label: "Implementacao", order: 3 },
  { id: "tests", label: "Testes", order: 4 },
  { id: "validation", label: "Validacao", order: 5 },
  { id: "integration", label: "Integracao", order: 6 },
];

function generateTasks(spec, category) {
  const taskTemplate = readFileSync(join(TEMPLATE_DIR, "task-template.md"), "utf8");
  const tasks = TASK_PHASES.map((phase, index) => {
    const taskId = `TASK-${String(phase.order).padStart(2, "0")}`;
    const description = getPhaseDescription(phase.id, category);
    const files = getAffectedFiles(phase.id, category);
    return {
      id: taskId,
      phase: phase.id,
      title: `${phase.label}: ${spec.slice(0, 60)}`,
      priority: phase.order <= 2 ? "alta" : phase.order <= 4 ? "media" : "baixa",
      estimate: getEstimate(phase.id),
      dependencies: getDependencies(phase.id),
      module: category?.id || "general",
      description,
      acceptance: getAcceptanceCriteria(phase.id),
      files,
      notes: "",
      rendered: taskTemplate
        .replace(/\{\{TASK_ID\}\}/g, taskId)
        .replace(/\{\{TASK_TITLE\}\}/g, `${phase.label}: ${spec.slice(0, 60)}`)
        .replace(/\{\{PRIORITY\}\}/g, phase.order <= 2 ? "alta" : phase.order <= 4 ? "media" : "baixa")
        .replace(/\{\{ESTIMATE\}\}/g, getEstimate(phase.id))
        .replace(/\{\{DEPENDENCIES\}\}/g, getDependencies(phase.id))
        .replace(/\{\{MODULE\}\}/g, category?.id || "general")
        .replace(/\{\{DESCRIPTION\}\}/g, description)
        .replace(/\{\{ACCEPTANCE\}\}/g, getAcceptanceCriteria(phase.id))
        .replace(/\{\{FILES\}\}/g, files)
        .replace(/\{\{NOTES\}\}/g, ""),
    };
  });
  return tasks;
}

function getPhaseDescription(phaseId, category) {
  const descs = {
    analysis: "Analisar requisitos, identificar componentes afetados e mapear dependencias.",
    planning: "Definir arquitetura, dividir em modulos e estabelecer cronograma de implementacao.",
    implementation: "Implementar a funcionalidade seguindo a especificacao e as convencoes do YAMI.",
    tests: "Criar e executar testes unitarios e de integracao para garantir o funcionamento esperado.",
    validation: "Validar a implementacao contra os criterios de aceite definidos na especificacao.",
    integration: "Integrar o novo modulo ao YAMI, registrar skills/plugins e atualizar a documentacao.",
  };
  return descs[phaseId] || "Fase do ciclo de evolucao.";
}

function getEstimate(phaseId) {
  const estimates = {
    analysis: "2h",
    planning: "1h",
    implementation: "8h",
    tests: "3h",
    validation: "2h",
    integration: "2h",
  };
  return estimates[phaseId] || "2h";
}

function getDependencies(phaseId) {
  const deps = {
    analysis: "Nenhuma",
    planning: "TASK-01 (Analise)",
    implementation: "TASK-02 (Planejamento)",
    tests: "TASK-03 (Implementacao)",
    validation: "TASK-04 (Testes)",
    integration: "TASK-05 (Validacao)",
  };
  return deps[phaseId] || "";
}

function getAcceptanceCriteria(phaseId) {
  const criteria = {
    analysis: "- Requisitos documentados\n- Componentes mapeados\n- Riscos identificados",
    planning: "- Arquitetura definida\n- Modulos separados\n- Cronograma estabelecido",
    implementation: "- Codigo implementado\n- Convencoes seguidas\n- Sem erros de lint",
    tests: "- Testes unitarios criados\n- Testes de integracao criados\n- Cobertura minima 70%",
    validation: "- Todos os criterios de aceite atendidos\n- Nenhum regression introduzido\n- Performance aceitavel",
    integration: "- Modulo registrado no YAMI\n- Documentacao atualizada\n- Changelog gerado",
  };
  return criteria[phaseId] || "- A definir";
}

function getAffectedFiles(phaseId, category) {
  const base = category?.id || "general";
  const files = {
    analysis: `- docs/espec/${base}/requisitos.md\n- docs/espec/${base}/analise.md`,
    planning: `- docs/espec/${base}/arquitetura.md\n- docs/espec/${base}/cronograma.md`,
    implementation: `- runtime/core/skills/${base}/\n- yami.json (se necessario)\n- runtime/yami-manifest.json (se necessario)`,
    tests: `- tests/${base}/\n- tests/${base}.test.mjs`,
    validation: `- docs/espec/${base}/validacao.md`,
    integration: `- runtime/yami-manifest.json\n- yami.json\n- docs/${base}/README.md`,
  };
  return files[phaseId] || "- A definir";
}

export function createPlan(spec, category) {
  const tasks = generateTasks(spec, category);
  return { tasks, phases: TASK_PHASES };
}

export { TASK_PHASES };
