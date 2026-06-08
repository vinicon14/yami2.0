#!/usr/bin/env node

/**
 * Test Suite for YAMI Account Management System
 * 
 * Execução:
 *   node test-account-system.js
 * 
 * Testes:
 * ✓ Estrutura de diretórios
 * ✓ Leitura de provedores
 * ✓ Criar/listar/deletar contas
 * ✓ Gerenciamento de tokens
 * ✓ Sincronização
 * ✓ Revogação
 * ✓ Backup/restore
 * ✓ Limpeza de dados stale
 */

const path = require("path");
const fs = require("fs");

// Importar AccountManager
const AccountManager = require("../auto-panel/account-manager.js");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

let passed = 0;
let failed = 0;

function log(color, ...args) {
  console.log(color + args.join(" ") + colors.reset);
}

function test(name, fn) {
  try {
    fn();
    log(colors.green, "✓", name);
    passed++;
  } catch (e) {
    log(colors.red, "✗", name);
    log(colors.red, "  ", e.message);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ===== TESTS =====

log(colors.cyan, "=== YAMI Account Manager Tests ===\n");

// Setup
const testDir = path.join(__dirname, "test-temp");
if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });

const manager = new AccountManager({ homeDir: testDir });

// Test 1: Directories
test("Criar estrutura de diretórios", () => {
  assert(fs.existsSync(testDir), "Diretório auth não criado");
  assert(fs.existsSync(path.join(testDir, "providers")), "Diretório providers não criado");
  assert(fs.existsSync(path.join(testDir, "tokens")), "Diretório tokens não criado");
});

// Test 2: Providers
test("Ler lista de provedores", () => {
  // Copiar registry.json para teste
  const source = path.join(__dirname, "providers", "registry.json");
  const dest = path.join(testDir, "providers", "registry.json");
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
  }
  
  const providers = manager.getProviders();
  assert(Array.isArray(providers), "Providers não é array");
  assert(providers.length > 0, "Nenhum provider carregado");
});

// Test 3: Get specific provider
test("Obter provedor específico", () => {
  const google = manager.getProvider("google");
  assert(google, "Google não encontrado");
  assert(google.id === "google", "ID incorreto");
  assert(google.authType === "oauth2", "authType incorreto");
});

// Test 4: Connect account
test("Conectar nova conta", () => {
  const account = manager.connectAccount("github", {
    displayName: "meu-github",
    email: "user@example.com"
  });
  assert(account.provider === "github", "Provider incorreto");
  assert(account.status === "connected", "Status incorreto");
  assert(account.displayName === "meu-github", "displayName incorreto");
});

// Test 5: Get connected accounts
test("Listar contas conectadas", () => {
  const connected = manager.getConnectedAccounts();
  assert(Array.isArray(connected), "Não retornou array");
  assert(connected.length === 1, `Esperado 1, obteve ${connected.length}`);
  assert(connected[0].provider === "github", "Provider incorreto");
});

// Test 6: Get specific account
test("Obter conta específica", () => {
  const account = manager.getAccount("github");
  assert(account, "Conta não encontrada");
  assert(account.provider === "github", "Provider incorreto");
});

// Test 7: Connect multiple accounts
test("Conectar múltiplas contas", () => {
  manager.connectAccount("google", { email: "user@gmail.com" });
  manager.connectAccount("microsoft", { email: "user@outlook.com" });
  
  const connected = manager.getConnectedAccounts();
  assert(connected.length === 3, `Esperado 3, obteve ${connected.length}`);
});

// Test 8: Save token
test("Salvar token de acesso", () => {
  const tokenData = {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    scope: "email calendar"
  };
  
  const saved = manager.saveToken("google", tokenData);
  assert(saved.accessToken === tokenData.accessToken, "Token não salvou corretamente");
});

// Test 9: Get token
test("Carregar token de acesso", () => {
  const token = manager.getToken("google");
  assert(token, "Token não encontrado");
  assert(token.accessToken === "test-access-token", "Token incorreto");
});

// Test 10: Check token expiry
test("Verificar expiração de token", () => {
  // Token não expirado
  const expired = manager.isTokenExpired("google");
  assert(!expired, "Token deveria estar válido");

  // Token expirado
  manager.saveToken("microsoft", {
    accessToken: "expired-token",
    expiresAt: new Date(Date.now() - 3600000).toISOString()
  });
  const expiredMs = manager.isTokenExpired("microsoft");
  assert(expiredMs, "Token deveria estar expirado");
});

// Test 11: Sync account
test("Sincronizar conta", () => {
  const before = manager.getAccount("github").lastSyncAt;
  
  // Aguardar 100ms para não ficar na mesma hora
  const sync = () => {
    const now = new Date();
    return new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
      const account = manager.syncAccount("github");
      assert(account.status === "connected", "Status deve ser connected");
      assert(account.lastSyncAt > before, "lastSyncAt não foi atualizado");
    });
  };
  
  return sync();
});

// Test 12: Set error
test("Registrar erro em conta", () => {
  const account = manager.setAccountError("google", "Token refresh failed");
  assert(account.status === "error", "Status deve ser error");
  assert(account.error === "Token refresh failed", "Mensagem de erro incorreta");
});

// Test 13: Clear error
test("Limpar erro de conta", () => {
  manager.clearAccountError("google");
  const account = manager.getAccount("google");
  assert(account.error === null, "Erro não foi limpo");
  assert(account.status === "connected", "Status deve voltar a connected");
});

// Test 14: Revoke account
test("Revogar permissões de conta", () => {
  const account = manager.revokeAccount("microsoft");
  assert(account.status === "revoked", "Status deve ser revoked");
  assert(account.permissions.every((p) => !p.granted), "Permissões devem estar revogadas");
});

// Test 15: Disconnect account
test("Desconectar conta", () => {
  manager.disconnectAccount("github");
  const account = manager.getAccount("github");
  assert(!account, "Conta deveria estar deletada");
});

// Test 16: Clear token
test("Limpar token de acesso", () => {
  manager.clearToken("google");
  const token = manager.getToken("google");
  assert(!token, "Token deveria estar deletado");
});

// Test 17: List tokens
test("Listar tokens salvos", () => {
  manager.saveToken("github", { accessToken: "test" });
  manager.saveToken("gitlab", { accessToken: "test" });
  
  const tokens = manager.listTokens();
  assert(tokens.includes("github"), "github não listado");
  assert(tokens.includes("gitlab"), "gitlab não listado");
});

// Test 18: Get status
test("Obter status geral de contas", () => {
  const status = manager.getStatus();
  assert(status.total > 0, "Deveria ter contas");
  assert(status.connected >= 0, "Contas conectadas inválido");
  assert(status.revoked >= 0, "Contas revogadas inválido");
  assert(status.errors >= 0, "Contas com erro inválido");
});

// Test 19: Export accounts
test("Exportar backup de contas", () => {
  const backup = manager.exportAccounts();
  assert(backup.exportedAt, "exportedAt ausente");
  assert(Array.isArray(backup.accounts), "accounts não é array");
  assert(backup.accounts.length > 0, "Deveria ter contas no backup");
});

// Test 20: Import accounts
test("Importar contas de backup", () => {
  const backup = {
    exportedAt: new Date().toISOString(),
    accounts: [
      {
        provider: "spotify",
        displayName: "Meu Spotify",
        email: "user@example.com",
        capabilities: [{ id: "playback", name: "Controle de reprodução" }]
      }
    ]
  };
  
  manager.importAccounts(backup);
  const account = manager.getAccount("spotify");
  assert(account, "Spotify não foi importado");
  assert(account.displayName === "Meu Spotify", "displayName incorreto");
});

// Test 21: Cleanup stale accounts
test("Limpar contas antigas (90 dias)", () => {
  // Criar conta muito antiga
  const accounts = manager.getAccounts();
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 100);
  
  const staleAccount = {
    provider: "old-service",
    status: "connected",
    displayName: "Old Account",
    lastSyncAt: oldDate.toISOString(),
    connectedAt: oldDate.toISOString(),
    permissions: [],
    scopes: [],
    error: null
  };
  
  accounts.push(staleAccount);
  manager.writeAccounts(accounts);
  
  const removed = manager.cleanupStaleAccounts(90);
  assert(removed === 1, `Deveria remover 1 conta, removeu ${removed}`);
  
  const stillThere = manager.getAccount("old-service");
  assert(!stillThere, "Conta antiga ainda existe");
});

// Test 22: Update existing account
test("Atualizar conta existente (reconectar)", () => {
  manager.connectAccount("google", {
    displayName: "Gmail Novo",
    email: "new@gmail.com"
  });
  
  const before = manager.getConnectedAccounts().filter((a) => a.provider === "google").length;
  
  manager.connectAccount("google", {
    displayName: "Gmail Atualizado",
    email: "updated@gmail.com"
  });
  
  const after = manager.getConnectedAccounts().filter((a) => a.provider === "google").length;
  
  assert(before === 1, "Deveria haver 1 Google antes");
  assert(after === 1, "Deveria haver 1 Google depois (não duplicou)");
  
  const account = manager.getAccount("google");
  assert(account.displayName === "Gmail Atualizado", "displayName não foi atualizado");
});

// Cleanup
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}

// Summary
log(colors.cyan, "\n=== Resultado ===");
log(colors.green, `✓ ${passed} testes passaram`);
if (failed > 0) {
  log(colors.red, `✗ ${failed} testes falharam`);
  process.exit(1);
} else {
  log(colors.green, "\n🎉 Todos os testes passaram!");
  process.exit(0);
}
