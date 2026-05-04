---
name: doc-sync
description: 扫描项目内所有 Markdown 文档，检测交叉引用、版本号、关键术语、待办标记的一致性，输出可执行的同步任务清单。当用户修改 PRD 后说"同步一下其他文档"、问"还缺什么文档/这些文档一致吗"，或新增/重命名/删除 .md 文件时使用。
---

# doc-sync — 文档一致性巡检员

> 扫描项目内所有 Markdown 文档，检测交叉引用、版本号、关键术语、待办标记的一致性，输出可执行的同步任务清单。

## 触发条件

以下任一情况发生时，**MUST** 调用本 skill：

1. 用户修改了 PRD.md / 核心设计文档后说"同步一下其他文档"
2. 用户问"还缺什么文档""这些文档一致吗""有没有遗漏"
3. 用户新增/重命名/删除了 `.md` 文件
4. 每次创建新文档后，作为收尾步骤自动执行

## 输入

- `project_root`: 项目根目录（默认当前工作目录）
- `core_doc`: 核心权威文档文件名（默认 `PRD.md`）
- `scope`: 检查范围（`fast` = 仅版本号 + 引用链；`full` = 全部检查项）

## 工作流

### Step 1 — 发现文档

扫描 `project_root` 下所有 `.md` 文件（排除 `node_modules/`、`dist/`、`.git/`）。

对每个文件提取：
- frontmatter（`project`、`version`、`status`、`last-updated`、`related`）
- 所有相对路径链接（`[text](path.md)`）
- 所有标题层级结构

### Step 2 — 版本号一致性检查

| 检查项 | 通过标准 | 失败时输出 |
|---|---|---|
| frontmatter `version` | 所有文档版本号相同，或与核心文档一致 | `版本不一致: data-model.md(v0.1.0) vs PRD.md(v0.1.2)` |
| frontmatter `last-updated` | 不早于核心文档的 `last-updated` | `data-model.md 最后更新日期(2026-05-03) 落后于 PRD.md(2026-05-04)` |
| 变更日志最新条目 | 变更日志中的最新版本号 = frontmatter 版本号 | `PRD.md frontmatter 版本(v0.1.2) ≠ 变更日志最新版本(v0.1.1)` |

### Step 3 — 交叉引用完整性检查

| 检查项 | 通过标准 | 失败时输出 |
|---|---|---|
| 引用目标存在 | `[text](path.md)` 中的 `path.md` 必须存在 | `broken-link: architecture.md 引用不存在的 api-design-v2.md` |
| 反向引用覆盖 | 被引用的文档 **SHOULD** 在 `related` 中回指 | `missing-backref: data-model.md 被 PRD.md 引用，但 related 未包含 PRD.md` |
| 锚点有效性 | `[text](doc.md#section)` 中的 `#section` 必须在目标文档中存在对应标题 | `broken-anchor: PRD.md#513-markdown-导出格式 在 PRD.md 中无对应标题` |

### Step 4 — 关键术语一致性检查

从 `core_doc` 中提取定义的**稳定术语表**，检查其他文档是否混用别名：

| 权威术语 | 常见错误别名 | 示例 |
|---|---|---|
| `AgentReply` | Agent Reply / agent_reply / agent-reply | `PRD.md` 用 `AgentReply`，`architecture.md` 用 `agentReply` |
| `Session` | session / 会话 / discussion | 正文用"会话"可以，但代码/字段名 MUST 用 `Session` |
| `system_prompt` | systemPrompt / prompt / 提示词 | `data-model.md` schema 用 `systemPrompt`，PRD 用 `system_prompt` → 不一致 |

> 🔧 实现方式：用 `Grep` 搜索术语出现位置，对比前后 10 个字符的上下文。

### Step 5 — 待办标记追踪

搜索所有 `.md` 中的待办/待确认标记：

- `（待写）` / `(待写)` / `TODO` / `FIXME` / `待确认`
- 标有 `[Deprecated]` 的 ID 项

输出追踪表：

| 标记 | 所在文件 | 上下文 | 建议处理 |
|---|---|---|---|
| `（待写）` | PRD.md §9 | "详细字段定义见 data-model.md（待写）" | data-model.md 已存在，应删除"待写" |
| `(草稿，等待用户审定)` | PRD.md §8.2 | system_prompt 旁标注 | 已审定，应删除标注 |

### Step 6 — 代码/配置与文档同步检查

检查项目中是否有代码文件包含和文档不一致的内容：

| 检查项 | 文件位置 | 对比文档 |
|---|---|---|
| 种子数据 systemPrompt | `prisma/seed.ts` 或 `data-model.md` §9 | PRD.md §8 |
| 环境变量列表 | `.env.example` | PRD.md §10.3 / deployment.md |
| 技术栈版本 | `package.json` | architecture.md §10.2 |
| API 端点路径 | `app/api/**/route.ts` | api-design.md |

### Step 7 — 生成报告

输出格式：

```markdown
# DocSync 巡检报告

生成时间: {YYYY-MM-DD HH:mm}
核心文档: PRD.md (v0.1.2)
扫描文档: 9 个 .md 文件

---

## 🔴 阻塞级（必须立即修复）

1. **[版本不一致]** data-model.md frontmatter 版本(v0.1.0) ≠ PRD.md(v0.1.2)
   - 建议: 将 data-model.md version 更新为 0.1.2，并在其变更日志追加条目

2. **[内容不同步]** prisma/seed.ts 中 systemPrompt 与 PRD.md §8.2 不一致
   - 建议: 同步种子数据，或删除 seed.ts（如果 data-model.md 是单一数据源）

## 🟡 警告级（建议修复）

3. **[broken-link]** wireframes.md 引用 `docs/PRD.md`，但 PRD.md 实际在根目录
   - 建议: 将链接改为 `[PRD.md](PRD.md)`

4. **[术语混用]** architecture.md 使用 `agentReply`，PRD.md 使用 `AgentReply`
   - 建议: 统一为 `AgentReply`

## 🟢 信息级（知晓即可）

5. **[待办标记]** PRD.md §8.2 仍标注"草稿，等待用户审定"
   - 建议: 如已审定，删除标注

---

## 本次修复任务清单

- [ ] data-model.md: 更新 version → 0.1.2，追加变更日志
- [ ] prisma/seed.ts: 同步 systemPrompt
- [ ] wireframes.md: 修正 PRD.md 链接路径
- [ ] architecture.md: `agentReply` → `AgentReply`
- [ ] PRD.md §8.2: 删除"草稿"标注
```

## 防退化规则

1. **MUST NOT** 仅检查 `core_doc` 本身而忽略被引用的下游文档。
2. **MUST NOT** 对 Markdown 语法错误（如缺少闭合反引号）报错——那不是本 skill 的职责。
3. **SHOULD** 对 `README.md` 做特殊处理：它通常是文档的"入口"，其版本号可以比核心文档低半级（如核心 v0.1.2，README 可以写 v0.1.x），但 **MUST NOT** 出现矛盾的功能描述。
4. **MUST** 在报告中给出具体的 `文件路径:行号` 位置，方便定位。

## 决策点

| 场景 | 处理方式 |
|---|---|
| 发现 broken-link 但目标文件确实不存在 | 标记为阻塞级，要求用户确认是文件遗漏还是链接错误 |
| 术语在代码/配置中与文档不一致 | 以文档为准还是代码为准？**默认以 PRD 为准**，但 MUST 在报告中标注矛盾 |
| 两个文档都标注了 `related: [对方]` 但内容冲突 | 标记为阻塞级，由用户裁决 |
