# GitHub 全量数据同步 — 设计文档

**最后更新**：2026-05-23
**影响范围**：存储层、Git 操作层、编辑器 Git 面板组件

---

## 1. 目标

将 GitHub 私有仓库作为云同步后端，实现换设备后完整恢复编辑环境和数据。

## 2. 核心原则

- **GitHub = 传输管道**：不做版本管理，用户自己通过文件名区分版本
- **本地优先**：localForage 是工作副本，GitHub 是备份和迁移媒介
- **敏感信息不上传**：SSH Key、AI API Key 仅存 localStorage

## 3. 仓库文件结构

```
/
├── resumes/
│   ├── 我的简历.md
│   ├── 我的简历.css
│   ├── 简历-字节跳动.md
│   ├── 简历-字节跳动.css
│   └── ...
├── settings.json           # 非敏感配置
├── assets/                 # 图片资产（二进制原始格式）
│   ├── photo.png
│   └── logo.jpg
└── .ohmycv/
    └── sync-state.json     # 同步状态（用于冲突检测）
```

## 4. 数据归属

| 数据 | 存储位置 | 原因 |
|------|---------|------|
| 简历 markdown | GitHub + localForage | 核心数据 |
| 简历 CSS | GitHub + localForage（独立 `.css` 文件） | 与 md 拆分存储 |
| 图片资产 | GitHub `assets/`（二进制） + localForage | 换设备可恢复，二进制更省空间 |
| 主题/字体/排版偏好 | GitHub `settings.json` + localForage | 非敏感，恢复编辑环境 |
| Git 仓库 URL | localStorage | 首次连接前需要 |
| SSH Key / Token | localStorage | 安全，绝不上传 |
| AI API Key | localStorage | 安全，绝不上传 |

## 5. 同步架构

```
localForage (IndexedDB)          GitHub 私有仓库
      │                                │
      ├── 编辑时实时读写                │
      │                                │
      └── GitHubSyncProvider ──────────┘
              │
              ├── 启动时：后台 pull，合并到本地
              ├── 空闲/关闭时：commit + push
              └── 冲突时：创建 {文件名}-冲突-{日期}.md
```

### 同步时机

| 时机 | 操作 | 说明 |
|------|------|------|
| 应用启动 | 读本地 → 后台 pull → 合并 | 本地秒开，远程静默更新 |
| 编辑中 | 仅写 localForage | 不产生 git 操作 |
| 关闭编辑器 / 切换简历 / 空闲 5min | commit + push | 一批改动打包上传 |
| 手动触发 | push + pull | 用户主动同步 |

## 6. 冲突处理

pull 时发现文件在两端都有改动时：

1. 保留本地版本不动
2. 创建 `{文件名}-冲突-{日期}.md` 存放远程版本
3. 通知用户：「发现冲突，已创建副本」

## 7. 首次配置流程

1. 用户在新设备输入仓库 URL + SSH Key
2. localStorage 持久化，后续免输入
3. clone 仓库到 lightning-fs
4. 将仓库内容合并到 localForage（首次 pull）
5. 之后正常使用

## 8. 组件改造

### GitSettings.vue（重做）
- 输入：仓库 URL + SSH Key → 存入 localStorage
- 首次配置后自动 clone
- 显示同步状态指示器（空闲 / 同步中 / 已同步 / 错误）

### GitHubSyncProvider（新增）
- 实现现有 `SyncProvider` 接口
- 负责：clone、pull、push、冲突检测
- 接入 `ResumeRepository`

### 移除
- `GitHistory.vue` — 不再需要版本历史和 checkout
- `Git.vue` 工具栏面板 — 简化为状态指示器

## 9. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重写 | `composables/git/gitops.ts` | 适配新文件结构 |
| 重写 | `composables/git/index.ts` | 实现 SyncProvider 接口 |
| 重写 | `components/editor/git/GitSettings.vue` | 新 UI + localStorage 持久化 |
| 删除 | `components/editor/git/GitHistory.vue` | 不再需要 |
| 修改 | `components/editor/toolbar/Git.vue` | 简化为状态指示器 |
| 修改 | `utils/storage/repository.ts` | 接入 SyncProvider |
