/**
 * Account Manager for YAMI
 * Centralizado gerenciamento de contas conectadas
 */

const fs = require("node:fs");
const path = require("node:path");

class AccountManager {
  constructor(config = {}) {
    this.homeDir = config.homeDir || path.join(process.env.YAMI_HOME || ".", ".yami", "auth");
    this.providersFile = path.join(this.homeDir, "providers", "registry.json");
    this.accountsFile = path.join(this.homeDir, "accounts.json");
    this.tokensDir = path.join(this.homeDir, "tokens");
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.homeDir, path.join(this.homeDir, "providers"), this.tokensDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  readJson(filePath, fallback = {}) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return fallback;
    }
  }

  writeJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  /**
   * Obter lista de todos os provedores disponíveis
   */
  getProviders() {
    const data = this.readJson(this.providersFile, { providers: [] });
    return data.providers || [];
  }

  /**
   * Obter um provedor específico
   */
  getProvider(providerId) {
    return this.getProviders().find((p) => p.id === providerId);
  }

  /**
   * Obter todas as contas conectadas
   */
  getAccounts() {
    const data = this.readJson(this.accountsFile, { accounts: [] });
    return data.accounts || [];
  }

  /**
   * Obter uma conta específica
   */
  getAccount(providerId) {
    return this.getAccounts().find((a) => a.provider === providerId);
  }

  /**
   * Obter todas as contas conectadas (apenas as ativas)
   */
  getConnectedAccounts() {
    return this.getAccounts().filter((a) => a.status === "connected");
  }

  /**
   * Conectar uma nova conta
   */
  connectAccount(providerId, options = {}) {
    const provider = this.getProvider(providerId);
    if (!provider) throw new Error(`Provider nao encontrado: ${providerId}`);

    const accounts = this.getAccounts();
    const now = new Date().toISOString();
    
    const accountEntry = {
      provider: providerId,
      status: "connected",
      displayName: options.displayName || provider.name,
      email: options.email || null,
      scopes: provider.scopes || [],
      permissions: (provider.capabilities || []).map((c) => ({
        id: c.id,
        name: c.name,
        granted: true,
        grantedAt: now
      })),
      connectedAt: options.connectedAt || now,
      lastSyncAt: options.lastSyncAt || now,
      error: null
    };

    const existingIndex = accounts.findIndex((a) => a.provider === providerId);
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...accountEntry };
    } else {
      accounts.push(accountEntry);
    }

    this.writeAccounts(accounts);
    return accountEntry;
  }

  /**
   * Desconectar uma conta (remove completely)
   */
  disconnectAccount(providerId) {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.provider === providerId);
    if (index < 0) throw new Error(`Conta nao encontrada: ${providerId}`);

    accounts.splice(index, 1);
    this.writeAccounts(accounts);

    // Limpar tokens
    this.clearToken(providerId);
  }

  /**
   * Revogar permissões (mantém a conta mas marca como revogada)
   */
  revokeAccount(providerId) {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.provider === providerId);
    if (!account) throw new Error(`Conta nao encontrada: ${providerId}`);

    account.status = "revoked";
    account.permissions = (account.permissions || []).map((p) => ({ ...p, granted: false }));
    account.error = "Permissoes revogadas pelo usuario";

    this.writeAccounts(accounts);
    return account;
  }

  /**
   * Sincronizar uma conta (atualizar último acesso)
   */
  syncAccount(providerId) {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.provider === providerId);
    if (!account) throw new Error(`Conta nao encontrada: ${providerId}`);

    account.lastSyncAt = new Date().toISOString();
    account.status = "connected";
    account.error = null;

    this.writeAccounts(accounts);
    return account;
  }

  /**
   * Marcar erro em uma conta
   */
  setAccountError(providerId, errorMessage) {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.provider === providerId);
    if (!account) throw new Error(`Conta nao encontrada: ${providerId}`);

    account.error = errorMessage;
    account.status = "error";

    this.writeAccounts(accounts);
    return account;
  }

  /**
   * Limpar erro de uma conta
   */
  clearAccountError(providerId) {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.provider === providerId);
    if (!account) throw new Error(`Conta nao encontrada: ${providerId}`);

    account.error = null;
    account.status = "connected";

    this.writeAccounts(accounts);
    return account;
  }

  /**
   * Salvar token de acesso
   */
  saveToken(providerId, tokenData) {
    const tokenDir = path.join(this.tokensDir, providerId);
    fs.mkdirSync(tokenDir, { recursive: true });
    
    const tokenFile = path.join(tokenDir, "token.json");
    const tokenInfo = {
      accessToken: tokenData.accessToken || null,
      refreshToken: tokenData.refreshToken || null,
      expiresAt: tokenData.expiresAt || null,
      tokenType: tokenData.tokenType || "Bearer",
      scope: tokenData.scope || null,
      savedAt: new Date().toISOString(),
      ...tokenData // Qualquer outro campo customizado
    };

    this.writeJson(tokenFile, tokenInfo);
    return tokenInfo;
  }

  /**
   * Carregar token de acesso
   */
  getToken(providerId) {
    const tokenFile = path.join(this.tokensDir, providerId, "token.json");
    return this.readJson(tokenFile, null);
  }

  /**
   * Verificar se token expirou
   */
  isTokenExpired(providerId) {
    const token = this.getToken(providerId);
    if (!token || !token.expiresAt) return false;
    return new Date(token.expiresAt) < new Date();
  }

  /**
   * Limpar token
   */
  clearToken(providerId) {
    const tokenDir = path.join(this.tokensDir, providerId);
    if (fs.existsSync(tokenDir)) {
      fs.rmSync(tokenDir, { recursive: true, force: true });
    }
  }

  /**
   * Listar todos os tokens salvos
   */
  listTokens() {
    if (!fs.existsSync(this.tokensDir)) return [];
    return fs.readdirSync(this.tokensDir).filter((f) => {
      const stat = fs.statSync(path.join(this.tokensDir, f));
      return stat.isDirectory();
    });
  }

  /**
   * Exportar backup de contas (sem tokens sensíveis)
   */
  exportAccounts() {
    return {
      exportedAt: new Date().toISOString(),
      accounts: this.getAccounts().map((a) => ({
        provider: a.provider,
        displayName: a.displayName,
        email: a.email,
        status: a.status,
        connectedAt: a.connectedAt,
        capabilities: this.getProvider(a.provider)?.capabilities || []
      }))
    };
  }

  /**
   * Importar contas de backup
   */
  importAccounts(backup) {
    if (!backup.accounts || !Array.isArray(backup.accounts)) {
      throw new Error("Formato invalido de backup");
    }

    for (const accountData of backup.accounts) {
      try {
        this.connectAccount(accountData.provider, {
          displayName: accountData.displayName,
          email: accountData.email,
          connectedAt: accountData.connectedAt
        });
      } catch (e) {
        console.error(`Erro ao importar ${accountData.provider}:`, e.message);
      }
    }
  }

  /**
   * Obter status completo de todas as contas
   */
  getStatus() {
    const accounts = this.getAccounts();
    const connected = accounts.filter((a) => a.status === "connected");
    const revoked = accounts.filter((a) => a.status === "revoked");
    const errors = accounts.filter((a) => a.status === "error");

    return {
      total: accounts.length,
      connected: connected.length,
      revoked: revoked.length,
      errors: errors.length,
      accounts: {
        connected: connected.map((a) => ({ provider: a.provider, name: a.displayName })),
        revoked: revoked.map((a) => ({ provider: a.provider, error: a.error })),
        errors: errors.map((a) => ({ provider: a.provider, error: a.error }))
      }
    };
  }

  /**
   * Limpar dados antigos (contas sem atualizar há X dias)
   */
  cleanupStaleAccounts(daysOld = 90) {
    const accounts = this.getAccounts();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const cleaned = accounts.filter((a) => {
      const lastSync = new Date(a.lastSyncAt || a.connectedAt);
      return lastSync > cutoff;
    });

    if (cleaned.length < accounts.length) {
      this.writeAccounts(cleaned);
      return accounts.length - cleaned.length;
    }
    return 0;
  }

  /**
   * Escrever contas no arquivo
   */
  writeAccounts(accounts) {
    this.writeJson(this.accountsFile, {
      accounts,
      updatedAt: new Date().toISOString()
    });
  }
}

module.exports = AccountManager;
