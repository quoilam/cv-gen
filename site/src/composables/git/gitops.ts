import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";
import localforage from "localforage";

export interface GitConfig {
  repoUrl: string;
  token: string;
}

// ---- File structure constants ----
const RESUMES_DIR = "resumes";
const ASSETS_DIR = "assets";
const SETTINGS_FILE = "settings.json";

// ---- Internal state ----
let _fs: LightningFS | null = null;
let _config: GitConfig | null = null;
const _dir = "/repo";
const configStore = localforage.createInstance({ name: "ohmycv_git_config" });

function _getFs(): LightningFS {
  if (!_fs) _fs = new LightningFS("ohmycv_git");
  return _fs;
}

function _getAuth() {
  if (!_config) throw new Error("Git not configured");
  return { username: _config.token, password: _config.token };
}

function _resumeMdPath(name: string): string {
  return `${RESUMES_DIR}/${name}.md`;
}
function _resumeCssPath(name: string): string {
  return `${RESUMES_DIR}/${name}.css`;
}
function _assetPath(name: string): string {
  return `${ASSETS_DIR}/${name}`;
}

// ---- Filesystem helpers ----
async function _ensureDir(filePath: string): Promise<void> {
  const fs = _getFs();
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  try {
    await fs.promises.mkdir(dir, { recursive: true } as any);
  } catch {
    // already exists
  }
}

async function _writeFile(relPath: string, content: string | Uint8Array): Promise<void> {
  const fs = _getFs();
  const fullPath = `${_dir}/${relPath}`;
  await _ensureDir(fullPath);
  await fs.promises.writeFile(fullPath, content);
}

async function _readFile(relPath: string): Promise<string | null> {
  try {
    const fs = _getFs();
    return await fs.promises.readFile(`${_dir}/${relPath}`, "utf8");
  } catch {
    return null;
  }
}

async function _readBinaryFile(relPath: string): Promise<Uint8Array | null> {
  try {
    const fs = _getFs();
    return await fs.promises.readFile(`${_dir}/${relPath}`);
  } catch {
    return null;
  }
}

async function _listDir(relPath: string): Promise<string[]> {
  try {
    const fs = _getFs();
    return await fs.promises.readdir(`${_dir}/${relPath}`);
  } catch {
    return [];
  }
}

async function _removeFile(relPath: string): Promise<void> {
  try {
    const fs = _getFs();
    await fs.promises.unlink(`${_dir}/${relPath}`);
  } catch {}
}

// ---- Public API ----
export const GitOps = {
  // --- Config persistence ---
  async loadConfig(): Promise<GitConfig | null> {
    if (_config) return _config;
    const saved = await configStore.getItem<GitConfig>("config");
    if (saved) _config = saved;
    return saved;
  },

  async saveConfig(config: GitConfig): Promise<void> {
    _config = config;
    await configStore.setItem("config", config);
  },

  async clearConfig(): Promise<void> {
    _config = null;
    await configStore.removeItem("config");
  },

  isConfigured(): boolean {
    return _config !== null;
  },

  getConfig(): GitConfig | null {
    return _config;
  },

  // --- Repo lifecycle ---
  async clone(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();
    try { await fs.promises.rmdir(_dir); } catch {}

    await git.clone({
      fs, http,
      dir: _dir,
      url: _config.repoUrl,
      onAuth: () => _getAuth(),
      singleBranch: true,
      depth: 10,
    });
  },

  async pull(): Promise<string[]> {
    // Returns list of conflicting file paths
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    // Snapshot local content before pull for conflict detection
    const before = await _snapshotContent();

    // Push any local changes first
    const status = await git.statusMatrix({ fs, dir: _dir });
    const dirty = status.filter(([, , ws, wt]) => ws !== 1 || wt !== 1);
    if (dirty.length > 0) {
      await _commitAndPush("auto: sync before pull");
    }

    await git.pull({
      fs, http,
      dir: _dir,
      author: { name: "ohmycv", email: "ohmycv@local" },
      onAuth: () => _getAuth(),
    });

    // Compare: which files changed remotely AND locally?
    const after = await _snapshotContent();
    const conflicts: string[] = [];
    for (const [path, oldContent] of Object.entries(before)) {
      const newContent = after[path];
      if (newContent !== undefined && newContent !== oldContent) {
        conflicts.push(path);
      }
    }

    return conflicts;
  },

  async push(message = "auto: sync"): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    await _commitAndPush(message);
  },

  // --- Resume files ---
  async writeResume(name: string, markdown: string, css: string): Promise<void> {
    await _writeFile(_resumeMdPath(name), markdown);
    await _writeFile(_resumeCssPath(name), css);
  },

  async readResume(name: string): Promise<{ markdown: string; css: string } | null> {
    const md = await _readFile(_resumeMdPath(name));
    const css = await _readFile(_resumeCssPath(name));
    if (md === null && css === null) return null;
    return { markdown: md ?? "", css: css ?? "" };
  },

  async deleteResumeFiles(name: string): Promise<void> {
    await _removeFile(_resumeMdPath(name));
    await _removeFile(_resumeCssPath(name));
  },

  async listResumeNames(): Promise<string[]> {
    const files = await _listDir(RESUMES_DIR);
    const names = new Set<string>();
    for (const f of files) {
      const m = f.match(/^(.+)\.(?:md|css)$/);
      if (m) names.add(m[1]);
    }
    return [...names];
  },

  // --- Settings ---
  async writeSettings(settings: object): Promise<void> {
    await _writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  },

  async readSettings<T = object>(): Promise<T | null> {
    const raw = await _readFile(SETTINGS_FILE);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },

  // --- Generic file I/O ---
  async writeFile(relPath: string, content: string): Promise<void> {
    await _writeFile(relPath, content);
  },

  async readFile(relPath: string): Promise<string | null> {
    return _readFile(relPath);
  },

  // --- Assets ---
  async writeAsset(filename: string, base64Data: string): Promise<void> {
    const binary = _base64ToUint8(base64Data);
    await _writeFile(_assetPath(filename), binary);
  },

  async readAsset(filename: string): Promise<string | null> {
    const data = await _readBinaryFile(_assetPath(filename));
    return data ? _uint8ToBase64(data) : null;
  },

  async listAssetNames(): Promise<string[]> {
    return _listDir(ASSETS_DIR);
  },

  // --- Bulk import (repo → localForage) ---
  async importAllToLocal(): Promise<{
    resumes: Array<{ name: string; markdown: string; css: string }>;
    settings: object | null;
  }> {
    const resumeNames = await GitOps.listResumeNames();
    const resumes: Array<{ name: string; markdown: string; css: string }> = [];
    for (const name of resumeNames) {
      const r = await GitOps.readResume(name);
      if (r) resumes.push({ name, ...r });
    }

    const settings = await GitOps.readSettings();

    return { resumes, settings };
  },

  // --- Export localForage → repo ---
  async exportAllFromLocal(
    resumes: Array<{ name: string; markdown: string; css: string }>,
    settings: object,
    assets: Array<{ id: string; name: string; base64: string }>,
  ): Promise<void> {
    for (const r of resumes) {
      await GitOps.writeResume(r.name, r.markdown, r.css);
    }
    await GitOps.writeSettings(settings);
    await GitOps.writeFile("assets.json", JSON.stringify(assets));
  },
};

// ---- Internal helpers ----

async function _commitAndPush(message: string): Promise<void> {
  if (!_config) throw new Error("Git not configured");
  const fs = _getFs();

  await git.add({ fs, dir: _dir, filepath: "." });

  await git.commit({
    fs, dir: _dir, message,
    author: { name: "ohmycv", email: "ohmycv@local" },
  });

  await git.push({
    fs, http, dir: _dir,
    onAuth: () => _getAuth(),
  });
}

/** Snapshot all tracked file contents for conflict detection */
async function _snapshotContent(): Promise<Record<string, string>> {
  const snap: Record<string, string> = {};
  const names = await GitOps.listResumeNames();
  for (const name of names) {
    const md = await _readFile(_resumeMdPath(name));
    if (md !== null) snap[_resumeMdPath(name)] = md;
    const css = await _readFile(_resumeCssPath(name));
    if (css !== null) snap[_resumeCssPath(name)] = css;
  }
  const settings = await _readFile(SETTINGS_FILE);
  if (settings !== null) snap[SETTINGS_FILE] = settings;
  const assets = await _readFile("assets.json");
  if (assets !== null) snap["assets.json"] = assets;
  return snap;
}

function _base64ToUint8(base64: string): Uint8Array {
  const b64 = base64.includes("base64,") ? base64.split("base64,")[1] : base64;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function _uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
