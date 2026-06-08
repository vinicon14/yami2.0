import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = join(__dirname, "..", "..", "evolucoes", ".registry.json");
const REGISTRY_DIR = dirname(REGISTRY_FILE);

function ensureRegistry() {
  if (!existsSync(REGISTRY_DIR)) {
    mkdirSync(REGISTRY_DIR, { recursive: true });
  }
  if (!existsSync(REGISTRY_FILE)) {
    writeFileSync(REGISTRY_FILE, JSON.stringify({ version: "1.0", evolutions: [] }, null, 2), "utf8");
  }
}

function readRegistry() {
  ensureRegistry();
  try {
    return JSON.parse(readFileSync(REGISTRY_FILE, "utf8"));
  } catch {
    return { version: "1.0", evolutions: [] };
  }
}

function writeRegistry(data) {
  ensureRegistry();
  writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), "utf8");
}

function registerEvolution(evolution) {
  const registry = readRegistry();
  const entry = {
    id: evolution.id,
    request: evolution.request,
    category: evolution.category,
    status: evolution.status || "gerado",
    createdAt: evolution.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    outputDir: evolution.outputDir,
    phase: evolution.phase || "spec",
    taskCount: evolution.taskCount || 0,
    validationScore: evolution.validationScore || 0,
    tags: evolution.tags || [],
  };
  registry.evolutions.push(entry);
  writeRegistry(registry);
  return entry;
}

function updateEvolution(id, updates) {
  const registry = readRegistry();
  const idx = registry.evolutions.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  registry.evolutions[idx] = {
    ...registry.evolutions[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeRegistry(registry);
  return registry.evolutions[idx];
}

function getEvolution(id) {
  const registry = readRegistry();
  return registry.evolutions.find((e) => e.id === id) || null;
}

function listEvolutions(filter = {}) {
  const registry = readRegistry();
  let evolutions = registry.evolutions;
  if (filter.status) evolutions = evolutions.filter((e) => e.status === filter.status);
  if (filter.category) evolutions = evolutions.filter((e) => e.category === filter.category);
  if (filter.phase) evolutions = evolutions.filter((e) => e.phase === filter.phase);
  if (filter.tag) evolutions = evolutions.filter((e) => e.tags?.includes(filter.tag));
  if (filter.search) {
    const q = filter.search.toLowerCase();
    evolutions = evolutions.filter((e) => e.request.toLowerCase().includes(q) || e.id.includes(q));
  }
  if (filter.since) {
    const sinceTime = new Date(filter.since).getTime();
    evolutions = evolutions.filter((e) => new Date(e.createdAt).getTime() >= sinceTime);
  }
  evolutions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return evolutions;
}

function deleteEvolution(id) {
  const registry = readRegistry();
  const idx = registry.evolutions.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  registry.evolutions.splice(idx, 1);
  writeRegistry(registry);
  return true;
}

function getStats() {
  const registry = readRegistry();
  const evolutions = registry.evolutions;
  const statuses = {};
  const categories = {};
  const phases = {};
  for (const e of evolutions) {
    statuses[e.status] = (statuses[e.status] || 0) + 1;
    categories[e.category] = (categories[e.category] || 0) + 1;
    phases[e.phase] = (phases[e.phase] || 0) + 1;
  }
  const avgScore = evolutions.length > 0 ? evolutions.reduce((sum, e) => sum + (e.validationScore || 0), 0) / evolutions.length : 0;
  return {
    total: evolutions.length,
    byStatus: statuses,
    byCategory: categories,
    byPhase: phases,
    averageValidationScore: Math.round(avgScore),
    oldestEvolution: evolutions.length > 0 ? evolutions[evolutions.length - 1].createdAt : null,
    newestEvolution: evolutions.length > 0 ? evolutions[0].createdAt : null,
  };
}

export { registerEvolution, updateEvolution, getEvolution, listEvolutions, deleteEvolution, getStats, REGISTRY_FILE };
