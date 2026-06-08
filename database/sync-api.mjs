import { createServer } from "node:http";

export class SyncAPI {
  constructor(db, syncEngine, options = {}) {
    this.db = db;
    this.syncEngine = syncEngine;
    this.options = {
      host: options.host || "127.0.0.1",
      port: options.port || 18900,
      apiKey: options.apiKey || null,
      allowRemote: options.allowRemote || false,
      ...options
    };
    this.server = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this._handleRequest(req, res));
      this.server.listen(this.options.port, this.options.host, () => {
        resolve(this.server.address());
      });
      this.server.once("error", reject);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  _handleRequest(req, res) {
    const setCors = () => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-YAMI-Sync-Key");
    };

    if (req.method === "OPTIONS") {
      setCors();
      res.writeHead(204);
      res.end();
      return;
    }

    setCors();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (req.method === "POST" && pathname === "/sync") {
      this._handleSync(req, res);
    } else if (req.method === "GET" && pathname === "/sync/status") {
      this._handleStatus(req, res);
    } else if (req.method === "GET" && pathname === "/sync/changes") {
      this._handleGetChanges(req, res, url);
    } else if (req.method === "POST" && pathname === "/sync/resolve") {
      this._handleResolveConflict(req, res);
    } else if (req.method === "GET" && pathname === "/sync/snapshot") {
      this._handleSnapshot(req, res);
    } else if (req.method === "POST" && pathname === "/sync/snapshot") {
      this._handleImportSnapshot(req, res);
    } else if (req.method === "GET" && pathname === "/health") {
      this._respondJson(res, 200, { ok: true, instance: this.db.getInstanceId(), uptime: process.uptime() });
    } else {
      this._respondJson(res, 404, { error: "not-found" });
    }
  }

  _checkAuth(req) {
    if (!this.options.apiKey) return true;
    const key = req.headers["x-yami-sync-key"];
    return key === this.options.apiKey;
  }

  _readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch {
          reject(new Error("invalid-json"));
        }
      });
      req.on("error", reject);
    });
  }

  _respondJson(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, 2));
  }

  async _handleSync(req, res) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    try {
      const body = await this._readBody(req);
      const result = await this.syncEngine.serveSyncRequest(body);
      this._respondJson(res, 200, result);
    } catch (err) {
      this._respondJson(res, 400, { error: err.message });
    }
  }

  async _handleStatus(req, res) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    const unsynced = this.db.getUnsyncedChanges(10);
    const conflicts = this.db.getPendingConflicts();
    const devices = this.db.getAllDevices();
    this._respondJson(res, 200, {
      instanceId: this.db.getInstanceId(),
      schemaVersion: this.db.getSchemaVersion(),
      unsyncedCount: unsynced.length,
      conflictCount: conflicts.length,
      deviceCount: devices.length,
      lastSyncTime: null,
      uptime: process.uptime()
    });
  }

  async _handleGetChanges(req, res, url) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    const table = url.searchParams.get("table") || null;
    const since = parseInt(url.searchParams.get("since") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "500", 10);
    const changes = table
      ? this.db.getChangesSince("remote", table, since)
      : this.db.getUnsyncedChanges(limit);
    this._respondJson(res, 200, { changes });
  }

  async _handleResolveConflict(req, res) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    try {
      const body = await this._readBody(req);
      const { conflictId, resolution, resolvedBy } = body;
      if (!conflictId || !resolution) {
        return this._respondJson(res, 400, { error: "conflictId and resolution required" });
      }
      this.db.resolveConflict(conflictId, resolution, resolvedBy);
      this._respondJson(res, 200, { ok: true });
    } catch (err) {
      this._respondJson(res, 400, { error: err.message });
    }
  }

  async _handleSnapshot(req, res) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    const snapshot = this.db.exportSnapshot();
    this._respondJson(res, 200, snapshot);
  }

  async _handleImportSnapshot(req, res) {
    if (!this._checkAuth(req)) {
      return this._respondJson(res, 401, { error: "unauthorized" });
    }
    try {
      const body = await this._readBody(req);
      const sourceInstance = body._meta?.instanceId || "unknown";
      this.db.importSnapshot(body, sourceInstance);
      this._respondJson(res, 200, { ok: true, imported: true, source: sourceInstance });
    } catch (err) {
      this._respondJson(res, 400, { error: err.message });
    }
  }
}

export function createSyncAPI(db, syncEngine, options) {
  return new SyncAPI(db, syncEngine, options);
}
