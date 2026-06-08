import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "templates");

const CATEGORIES = [
  { id: "integration", label: "Nova integracao", keywords: ["integracao", "conectar", "api", "servico", "app", "aplicativo"] },
  { id: "feature", label: "Nova funcionalidade", keywords: ["funcionalidade", "recurso", "feature", "comando", "comando de voz"] },
  { id: "automation", label: "Automacao", keywords: ["automacao", "automatizar", "rotina", "trigger", "gatilho"] },
  { id: "agent", label: "Agente interno", keywords: ["agente", "skill", "plugin", "interno"] },
  { id: "ui", label: "Interface", keywords: ["interface", "dashboard", "painel", "tela", "visual"] },
  { id: "productivity", label: "Produtividade", keywords: ["produtividade", "produtivo", "atalho", "shortcut"] },
  { id: "voice", label: "Sistema de voz", keywords: ["voz", "audio", "fala", "tts", "stt", "whisper"] },
  { id: "sync", label: "Sincronizacao", keywords: ["sincronizacao", "sync", "dispositivo", "nuvem", "cloud"] },
  { id: "other", label: "Outro", keywords: [] },
];

function classifyRequest(text) {
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }
  return CATEGORIES.find((c) => c.id === "other");
}

function generateId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `evol-${ts}-${rand}`;
}

function buildSpecFromRequest(request, category) {
  const id = generateId();
  const date = new Date().toISOString();
  const template = readFileSync(join(TEMPLATE_DIR, "spec-template.md"), "utf8");
  return template
    .replace(/\{\{TITLE\}\}/g, request.slice(0, 80))
    .replace(/\{\{ID\}\}/g, id)
    .replace(/\{\{VERSION\}\}/g, "0.1.0")
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, `Implementacao baseada na solicitacao: "${request}".\n\nCategoria: ${category.label}`)
    .replace(/\{\{MOTIVATION\}\}/g, `Solicitacao do usuario para ${category.label.toLowerCase()}.`)
    .replace(/\{\{FUNCTIONAL_REQUIREMENTS\}\}/g, "- [ ] A ser definido durante a fase de analise")
    .replace(/\{\{NON_FUNCTIONAL_REQUIREMENTS\}\}/g, "- Modularidade\n- Rastreabilidade\n- Compatibilidade com YAMI\n- Documentacao automatica")
    .replace(/\{\{ARCHITECTURE\}\}/g, "A ser definida. Seguir os principios:\n- Modularidade\n- Baixo acoplamento\n- Integracao via skill/plugin do YAMI")
    .replace(/\{\{COMPONENTS\}\}/g, "- A definir apos analise completa")
    .replace(/\{\{DEPENDENCIES\}\}/g, "- YAMI runtime core\n- Node.js 22+\n- Dependencias externas a definir")
    .replace(/\{\{YAMI_INTERFACE\}\}/g, "- Registrar skill em yami.json\n- Registrar modulo em yami-manifest.json\n- Seguir convencoes de skills YAMI")
    .replace(/\{\{RISKS\}\}/g, "- Impacto em desempenho\n- Compatibilidade com versoes futuras\n- Dependencias externas")
    .replace(/\{\{ACCEPTANCE_CRITERIA\}\}/g, "- [ ] Funcionalidade implementada\n- [ ] Testes validados\n- [ ] Documentacao gerada\n- [ ] Integrado ao YAMI");
}

export function generateSpec(request) {
  const category = classifyRequest(request);
  const spec = buildSpecFromRequest(request, category);
  return { spec, category, id: generateId() };
}

export { classifyRequest, CATEGORIES, generateId };
