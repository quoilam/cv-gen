import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";

export interface GitConfig {
  repoUrl: string;
  token: string;
}

export interface CommitInfo {
  oid: string;
  message: string;
  author: string;
  timestamp: number;
}

let _fs: LightningFS | null = null;
let _config: GitConfig | null = null;
const _dir = "/resumes";

function _getFs(): LightningFS {
  if (!_fs) _fs = new LightningFS("ohmycv_git");
  return _fs;
}

function _getAuth() {
  if (!_config) throw new Error("Git not configured");
  return {
    username: _config.token,
    password: _config.token
  };
}

export const GitOps = {
  configure(config: GitConfig) {
    _config = config;
  },

  isConfigured(): boolean {
    return _config !== null;
  },

  async clone(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.clone({
      fs,
      http,
      dir: _dir,
      url: _config.repoUrl,
      onAuth: () => _getAuth(),
      singleBranch: true,
      depth: 10
    });
  },

  async pull(): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.pull({
      fs,
      http,
      dir: _dir,
      author: { name: "ohmycv", email: "ohmycv@local" },
      onAuth: () => _getAuth()
    });
  },

  async commitAndPush(message: string): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.add({ fs, dir: _dir, filepath: "." });

    await git.commit({
      fs,
      dir: _dir,
      message,
      author: { name: "ohmycv", email: "ohmycv@local" }
    });

    await git.push({
      fs,
      http,
      dir: _dir,
      onAuth: () => _getAuth()
    });
  },

  async getHistory(limit = 20): Promise<CommitInfo[]> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    const commits = await git.log({ fs, dir: _dir, depth: limit });

    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author.name,
      timestamp: c.commit.author.timestamp
    }));
  },

  async checkout(oid: string): Promise<void> {
    if (!_config) throw new Error("Git not configured");
    const fs = _getFs();

    await git.checkout({ fs, dir: _dir, ref: oid });
  },

  async writeFile(filepath: string, content: string): Promise<void> {
    const fs = _getFs();
    const fullPath = `${_dir}/${filepath}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));

    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch {
      // directory already exists
    }

    await fs.promises.writeFile(fullPath, content);
  },

  async readFile(filepath: string): Promise<string> {
    const fs = _getFs();
    return fs.promises.readFile(`${_dir}/${filepath}`, "utf8");
  }
};
