# Vibe Coding Skills

> 一组为 Claude Code 设计的 skill 集合，聚焦 **vibe coding** 场景：让 AI 生成代码前，先把产品定义、文档结构、技术栈、设计规范、提示词全部规范化。

A collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills focused on vibe coding workflows.

---

## 包含的 Skills

| Skill | 用途 | 什么时候自动触发 |
|---|---|---|
| **vibe-coding-prd** | Vibe Coding PRD 撰写规范——给 AI 看的代码生成指令书 | 用户说"帮我写个 PRD"、要把传统 PRD 改造成 vibe coding 版本时 |
| **project-planning** | 项目文档与项目规划——判断需要写哪些文档、不需要哪些文档 | 用户问"这个项目需要写哪些文档/还缺什么文档"，或文档太乱要重新梳理时 |
| **tech-stack-advisor** | 技术栈选型顾问——根据项目特征推荐最小可用技术栈 | 用户问"这个项目用什么技术做"、"帮我选一个技术栈"时 |
| **engineering-review** | 工程完备性审查（基于钱学森工程控制论的系统论/控制论/信息论） | 技术方案完成后进入编码前、上线前完备性检查、系统反复故障复盘时 |
| **design-token-extractor** | 从设计参考素材中提取设计 token、组件规范和代码实现建议 | 用户提供设计参考说"按这个风格做"、视觉改版后更新规范时 |
| **prompt-researcher** | 角色提示词研究员——基于真实资料生成有深度的 system_prompt | 用户要求写/优化 Agent 提示词、新增角色、说"Agent 输出太平淡"时 |
| **doc-sync** | 文档一致性巡检员——检测交叉引用、版本号、术语、待办标记的一致性 | 用户修改 PRD 后说"同步一下其他文档"、新增/删除 .md 文件时 |

每个 skill 文件夹下的 `SKILL.md` 都包含 frontmatter（`name` + `description`）、详细工作流、防退化规则和决策点。

---

## 安装

将本仓库的 7 个文件夹复制到 Claude Code 的用户级 skill 目录：

**macOS / Linux**：
```bash
git clone https://github.com/s2447920817-boop/vibe-coding-.git
cd vibe-coding-
cp -r design-token-extractor doc-sync engineering-review project-planning prompt-researcher tech-stack-advisor vibe-coding-prd ~/.claude/skills/
```

**Windows (Git Bash / PowerShell)**：
```bash
git clone https://github.com/s2447920817-boop/vibe-coding-.git
cd vibe-coding-
cp -r design-token-extractor doc-sync engineering-review project-planning prompt-researcher tech-stack-advisor vibe-coding-prd "$HOME/.claude/skills/"
```

安装完成后，重启 Claude Code,新的 skills 会出现在可用 skill 列表里。

---

## 用法

Claude Code 会根据每个 skill 的 `description` 字段自动判断什么时候调用。你也可以显式触发：

```
/vibe-coding-prd
/project-planning
/tech-stack-advisor
...
```

---

## 适用场景

这套 skills 的设计前提：

- **个人或小团队 vibe coding** —— 用 AI 写代码为主，没有专职 PM/QA/设计师
- **产品宪法集中在 PRD** —— PRD 是项目唯一权威来源，其他文档围绕它展开
- **AI 友好的文档** —— 文档是写给 AI 看的"代码生成指令书"，不是写给人看的"产品论证书"

如果你是企业级团队、有完整流程链路，这些 skill 可能过于精简，建议作为参考而不是直接使用。

---

## License

MIT — 详见 [LICENSE](LICENSE)。

## 作者

Praise the fool ([@s2447920817-boop](https://github.com/s2447920817-boop))
