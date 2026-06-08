import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "templates");

const TARGETS = [
  { id: "codex", label: "Codex CLI", bin: "codex", command: 'codex exec - < "$PROMPT"' },
  { id: "claude", label: "Claude Code", bin: "claude", command: 'claude --permission-mode bypassPermissions --print < "$PROMPT"' },
  { id: "opencode", label: "OpenCode", bin: "opencode", command: 'opencode run < "$PROMPT"' },
];

function buildPrompt(task, spec, target) {
  const template = readFileSync(join(TEMPLATE_DIR, "prompt-template.md"), "utf8");
  const context = `Projeto: YAMI (assistente runtime local)\nManifesto: runtime/yami-manifest.json\nSkill: ${task.module || "general"}\nTarefa: ${task.id} - ${task.title}`;
  return template
    .replace(/\{\{TOOL\}\}/g, target.label)
    .replace(/\{\{TASK_TITLE\}\}/g, task.title)
    .replace(/\{\{CONTEXT\}\}/g, context)
    .replace(/\{\{OBJECTIVE\}\}/g, task.description)
    .replace(/\{\{SPECIFICATION\}\}/g, spec)
    .replace(/\{\{FILES\}\}/g, task.files)
    .replace(/\{\{CONSTRAINTS\}\}/g, "- Seguir convencoes YAMI\n- Usar ESM (import/export)\n- Nao quebrar compatibilidade\n- Manter modularidade")
    .replace(/\{\{VALIDATION\}\}/g, task.acceptance)
    .replace(/\{\{NOTIFICATION\}\}/g, "Ao finalizar, registrar conclusao no historico de evolucao.");
}

function writePrompts(tasks, spec, outputDir, targetIds) {
  const promptDir = join(outputDir, "prompts");
  if (!existsSync(promptDir)) mkdirSync(promptDir, { recursive: true });
  const targets = TARGETS.filter((t) => !targetIds || targetIds.includes(t.id));
  const promptFiles = {};
  for (const task of tasks) {
    for (const target of targets) {
      const prompt = buildPrompt(task, spec, target);
      const filePath = join(promptDir, `${target.id}-${task.id}.md`);
      writeFileSync(filePath, prompt, "utf8");
      promptFiles[`${target.id}:${task.id}`] = filePath;
    }
  }
  return promptFiles;
}

function writeCombinedPrompts(tasks, spec, outputDir, targetIds) {
  const targets = TARGETS.filter((t) => !targetIds || targetIds.includes(t.id));
  const combinedDir = join(outputDir, "prompts");
  if (!existsSync(combinedDir)) mkdirSync(combinedDir, { recursive: true });
  const files = {};
  for (const target of targets) {
    const header = `# Prompt combinado para ${target.label}\n\n## Instrucao de execucao\n\n\`\`\`bash\n${target.command}\n\`\`\`\n\n---\n\n`;
    const body = tasks.map((t) => buildPrompt(t, spec, target)).join("\n\n---\n\n");
    const filePath = join(combinedDir, `${target.id}-combinado.md`);
    writeFileSync(filePath, header + body, "utf8");
    files[target.id] = filePath;
  }
  return files;
}

export function buildPrompts(tasks, spec, outputDir, options = {}) {
  const { targetIds, combined } = options;
  const individual = writePrompts(tasks, spec, outputDir, targetIds);
  const combinedFiles = combined !== false ? writeCombinedPrompts(tasks, spec, outputDir, targetIds) : {};
  const manifest = {};
  for (const target of TARGETS) {
    if (!targetIds || targetIds.includes(target.id)) {
      manifest[target.id] = {
        label: target.label,
        bin: target.bin,
        command: target.command,
        individual: individual,
        combined: combinedFiles[target.id],
      };
    }
  }
  return manifest;
}

export { TARGETS };
