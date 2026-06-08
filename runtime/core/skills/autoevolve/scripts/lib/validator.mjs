import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALIDATION_CHECKS = [
  { id: "spec_exists", label: "Especificacao existe", check: (dir) => existsSync(join(dir, "spec.md")) },
  { id: "spec_not_empty", label: "Especificacao nao vazia", check: (dir) => { const c = readFileSync(join(dir, "spec.md"), "utf8"); return c.length > 100; }},
  { id: "tasks_exists", label: "Tarefas definidas", check: (dir) => existsSync(join(dir, "tasks.json")) },
  { id: "tasks_valid_json", label: "Tarefas em JSON valido", check: (dir) => { try { JSON.parse(readFileSync(join(dir, "tasks.json"), "utf8")); return true; } catch { return false; }}},
  { id: "prompts_exist", label: "Prompts gerados", check: (dir) => existsSync(join(dir, "prompts")) },
  { id: "prompts_codex", label: "Prompt Codex existe", check: (dir) => existsSync(join(dir, "prompts", "codex-TASK-01.md")) || existsSync(join(dir, "prompts", "codex-combinado.md")) },
  { id: "history_recorded", label: "Historico registrado", check: (_dir, ctx) => ctx?.historyId ? true : false },
];

function validateOutput(outputDir, context = {}) {
  const results = VALIDATION_CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    passed: check.check(outputDir, context),
  }));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);
  return {
    results,
    passed,
    total,
    score,
    status: score >= 80 ? "aprovado" : score >= 50 ? "atencao" : "reprovado",
    timestamp: new Date().toISOString(),
  };
}

function validateImplementation(spec, codeDir) {
  const checks = [
    { id: "files_exist", label: "Arquivos de implementacao existem", check: existsSync(codeDir) },
    { id: "has_package_json", label: "package.json presente", check: () => existsSync(join(codeDir, "package.json")) || existsSync(join(codeDir, "..", "package.json")) },
  ];
  if (spec) {
    const specLower = spec.toLowerCase();
    if (specLower.includes("skill") || specLower.includes("skill.md")) {
      checks.push({ id: "skill_md", label: "SKILL.md criado", check: () => existsSync(join(codeDir, "SKILL.md")) || findSkillFile(codeDir) });
    }
    if (specLower.includes("test")) {
      checks.push({ id: "tests", label: "Testes criados", check: () => findTestFiles(codeDir) });
    }
  }
  return checks.map((c) => ({ id: c.id, label: c.label, passed: c.check() }));
}

function findSkillFile(dir) {
  if (existsSync(join(dir, "SKILL.md"))) return true;
  const parts = dir.split(/[\\/]/);
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = join(parts.slice(0, i + 1).join("\\"), "SKILL.md");
    if (existsSync(candidate)) return true;
  }
  return false;
}

function findTestFiles(dir) {
  if (!existsSync(dir)) return false;
  const entries = readFileSync(join(dir, "..", "..", "..", "..", ".."), { encoding: "utf8", flag: "r" });
  return false;
}

export { validateOutput, validateImplementation, VALIDATION_CHECKS };
