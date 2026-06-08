#!/usr/bin/env node

// YAMI Pendrive Bootstrap
// Lightweight entry point that auto-detects install state and runs the correct runtime.

import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PENDIR = join(__dirname, "..");
const YAMI_HOME = join(process.env.USERPROFILE || process.env.HOME || ".", ".yami");
const RUNTIME_CORE = join(PENDIR, "runtime", "core");
const INSTALLED_CORE = join(YAMI_HOME, "runtime", "core");
const CONFIG_PATH = join(YAMI_HOME, "yami.json");
const PANEL_SERVER = join(YAMI_HOME, "auto-panel", "server.js");

const YAMI_MANIFEST_PATH = join(YAMI_HOME, "runtime", "yami-manifest.json");
const PENDIVE_MANIFEST = join(PENDIR, "runtime", "yami-manifest.json");

function log(msg) {
  process.stdout.write(`[yami-pendrive] ${msg}\n`);
}

function ensureInstalled() {
  if (existsSync(INSTALLED_CORE) && existsSync(CONFIG_PATH)) {
    log("YAMI ja instalado.");
    return true;
  }

  log("Instalando YAMI a partir do pendrive...");
  mkdirSync(YAMI_HOME, { recursive: true });

  // Copy runtime core
  const targetRuntime = join(YAMI_HOME, "runtime");
  mkdirSync(targetRuntime, { recursive: true });

  if (existsSync(RUNTIME_CORE)) {
    const cp = spawn("robocopy", [RUNTIME_CORE, INSTALLED_CORE, "/E", "/NP"], {
      stdio: "inherit",
      shell: true,
    });
    cp.on("exit", (code) => {
      if (code !== null && code <= 7) {
        log("Runtime copiado com sucesso.");
      }
    });
  }

  // Copy dashboard
  const panelSrc = join(PENDIR, "dashboard");
  const panelDst = join(YAMI_HOME, "auto-panel");
  if (existsSync(panelSrc)) {
    mkdirSync(panelDst, { recursive: true });
    const cp2 = spawn("robocopy", [panelSrc, panelDst, "/E", "/NP"], {
      stdio: "inherit",
      shell: true,
    });
  }

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0] || "";

  if (firstArg === "--install") {
    ensureInstalled();
    log("Instalacao concluida.");
    process.exit(0);
  }

  if (firstArg === "--start" || firstArg === "") {
    ensureInstalled();

    // Start the panel server if not running
    if (existsSync(PANEL_SERVER)) {
      log("Iniciando Dashboard Yami...");
      const child = spawn("node", [PANEL_SERVER], {
        cwd: dirname(PANEL_SERVER),
        stdio: "inherit",
        detached: true,
        env: {
          ...process.env,
          YAMI_HOME,
          YAMI_CONFIG_PATH: CONFIG_PATH,
          YAMI_PANEL_PORT: "18808",
          YAMI_ENTRYPOINT: join(INSTALLED_CORE, "yami.mjs"),
        },
      });
      child.unref();
      log("Dashboard disponivel em http://127.0.0.1:18808/");
    }

    // Open the dashboard
    const { exec } = await import("node:child_process");
    exec(`start http://127.0.0.1:18808/?voice=1`);
    return;
  }

  // Delegate to the real runtime
  const entryPoint = join(INSTALLED_CORE, "yami.mjs");
  if (existsSync(entryPoint)) {
    const child = spawn(process.execPath, [entryPoint, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        YAMI_HOME,
        YAMI_CONFIG_PATH: CONFIG_PATH,
        OPENCLAW_HOME: YAMI_HOME,
        OPENCLAW_CONFIG_PATH: CONFIG_PATH,
        OPENCLAW_STATE_DIR: YAMI_HOME,
      },
    });
    child.on("exit", (code) => process.exit(code));
  } else {
    log("Runtime Yami nao encontrado. Execute com --install primeiro.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[yami-pendrive] Erro:", err.message);
  process.exit(1);
});
