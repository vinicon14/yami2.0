import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = join(__dirname, "..", "..", "evolucoes");
const HISTORY_FILE = join(HISTORY_DIR, "HISTORY.md");

function ensureHistoryDir() {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function readHistory() {
  ensureHistoryDir();
  if (!existsSync(HISTORY_FILE)) {
    const initial = [
      "# Historico de Evolucao YAMI",
      "",
      "Registro de todas as transformacoes realizadas pelo sistema de autoevolucao.",
      "",
      "---",
      "",
    ].join("\n");
    writeFileSync(HISTORY_FILE, initial, "utf8");
    return [];
  }
  return readFileSync(HISTORY_FILE, "utf8");
}

function formatEntry(record) {
  const lines = [
    `## ${record.id}`,
    "",
    `**Data:** ${record.date}`,
    `**Solicitacao:** ${record.request}`,
    `**Categoria:** ${record.category}`,
    `**Status:** ${record.status}`,
    "",
    "### Arquivos gerados",
    "",
  ];
  if (record.files) {
    for (const [key, path] of Object.entries(record.files)) {
      lines.push(`- \`${key}\`: ${path}`);
    }
  }
  lines.push("", "---", "");
  return lines.join("\n");
}

function recordEvolution(entry) {
  ensureHistoryDir();
  const record = {
    id: entry.id,
    date: entry.date || new Date().toISOString(),
    request: entry.request,
    category: entry.category,
    status: entry.status || "gerado",
    files: entry.files || {},
    specPath: entry.specPath || "",
    tasksPath: entry.tasksPath || "",
    outputDir: entry.outputDir || "",
  };
  const historyContent = readHistory();
  const entryMd = formatEntry(record);
  writeFileSync(HISTORY_FILE, historyContent + entryMd, "utf8");
  return record;
}

function updateStatus(evolutionId, status) {
  ensureHistoryDir();
  if (!existsSync(HISTORY_FILE)) return null;
  let content = readFileSync(HISTORY_FILE, "utf8");
  const headerRegex = new RegExp(`(## ${evolutionId}\\n\\n\\*\\*Data:\\*\\* .+\\n\\*\\*Solicitacao:\\*\\* .+\\n\\*\\*Categoria:\\*\\* .+\\n\\*\\*Status:\\*\\* )(.+)(\\n)`);
  content = content.replace(headerRegex, `$1${status}$3`);
  writeFileSync(HISTORY_FILE, content, "utf8");
  return content;
}

function listEvolutions() {
  ensureHistoryDir();
  if (!existsSync(HISTORY_FILE)) return [];
  const content = readFileSync(HISTORY_FILE, "utf8");
  const entries = [];
  const regex = /## (.+?)\n\n\*\*Data:\*\* (.+?)\n\*\*Solicitacao:\*\* (.+?)\n\*\*Categoria:\*\* (.+?)\n\*\*Status:\*\* (.+?)\n/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.push({
      id: match[1],
      date: match[2],
      request: match[3],
      category: match[4],
      status: match[5],
    });
  }
  return entries;
}

export { recordEvolution, updateStatus, listEvolutions, HISTORY_FILE };
