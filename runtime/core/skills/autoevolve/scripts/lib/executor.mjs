import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { updateEvolution } from "./registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOOLS = {
  codex: {
    bin: "codex",
    cmd: 'codex exec - < "$PROMPT"',
    pty: true,
    description: "OpenAI Codex - AI code generation",
  },
  claude: {
    bin: "claude",
    cmd: 'claude --permission-mode bypassPermissions --print < "$PROMPT"',
    pty: false,
    description: "Anthropic Claude Code",
  },
  opencode: {
    bin: "opencode",
    cmd: 'opencode run < "$PROMPT"',
    pty: true,
    description: "OpenCode Agent",
  },
};

function checkToolAvailable(tool) {
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    spawnSync(cmd, [TOOLS[tool].bin], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function getAvailableTools() {
  return Object.entries(TOOLS)
    .filter(([key]) => checkToolAvailable(key))
    .map(([key, val]) => ({ id: key, ...val }));
}

async function executePrompt(evolutionId, taskId, tool, promptFile, workdir = ".") {
  const toolConfig = TOOLS[tool];
  if (!toolConfig) throw new Error(`Tool desconhecida: ${tool}`);
  if (!checkToolAvailable(tool)) throw new Error(`Ferramenta nao disponivel: ${toolConfig.bin}`);
  if (!existsSync(promptFile)) throw new Error(`Arquivo de prompt nao encontrado: ${promptFile}`);
  const outputDir = join(dirname(promptFile), "..", "..", "execucoes", tool, taskId);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const logFile = join(outputDir, "execution.log");
  const prompt = readFileSync(promptFile, "utf8");
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const env = { ...process.env, PROMPT_FILE: promptFile };
    const args = ["-c", toolConfig.cmd.replace("$PROMPT", promptFile)];
    const proc = spawn("bash", args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: workdir,
      env,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      const duration = Date.now() - startTime;
      const result = {
        evolutionId,
        taskId,
        tool,
        status: code === 0 ? "sucesso" : "erro",
        exitCode: code,
        duration,
        timestamp: new Date().toISOString(),
        outputDir,
        logFile,
        stdout: stdout.slice(0, 5000),
        stderr: stderr.slice(0, 5000),
      };
      writeFileSync(logFile, JSON.stringify(result, null, 2), "utf8");
      writeFileSync(join(outputDir, "stdout.txt"), stdout, "utf8");
      writeFileSync(join(outputDir, "stderr.txt"), stderr, "utf8");
      updateEvolution(evolutionId, {
        phase: `executing-${taskId}`,
        lastExecution: result.timestamp,
        lastExecutionStatus: result.status,
      });
      if (code === 0) resolve(result);
      else reject(new Error(`Execução falhou com código ${code}: ${stderr}`));
    });
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function executeBackground(evolutionId, taskId, tool, promptFile, outputDir) {
  const toolConfig = TOOLS[tool];
  if (!toolConfig) throw new Error(`Tool desconhecida: ${tool}`);
  const logFile = join(outputDir, `background-${tool}-${taskId}.log`);
  const args = ["-c", toolConfig.cmd.replace("$PROMPT", promptFile)];
  const proc = spawn("bash", args, {
    stdio: "ignore",
    detached: true,
    cwd: ".",
    env: { ...process.env, PROMPT_FILE: promptFile },
  });
  proc.unref();
  return {
    processId: proc.pid,
    tool,
    taskId,
    startedAt: new Date().toISOString(),
    logFile,
  };
}

export { executePrompt, executeBackground, checkToolAvailable, getAvailableTools, TOOLS };
