---
name: design-token-extractor
description: 从设计参考素材（截图/HTML/Figma/zip）中提取结构化的设计 token、组件规范和代码实现建议。当用户提供设计参考说"按这个风格做"、"提取设计稿规范"、视觉改版后更新规范，或发现代码样式与设计稿不一致时使用。
---

# design-token-extractor — 设计规范提取

> 从设计参考素材（截图、HTML、Figma、设计稿）中提取结构化的设计 token、组件规范和代码实现建议。适用于任何需要视觉一致性的项目。

## 触发条件

以下任一情况发生时，**MUST** 调用本 skill：

1. 用户提供了设计参考文件（zip、图片、HTML、Figma 链接）并说"按这个风格做"
2. 用户说"提取一下这个设计稿的规范"
3. 视觉改版后，需要更新设计 token 文档
4. 发现代码中的样式与设计稿不一致，需要重建规范来源

## 输入

- `source_files`: 设计参考素材路径列表（图片、HTML、CSS、zip 等）
- `source_priority`: 当多个素材矛盾时，哪个优先（`code` / `screenshot` / `design-doc`）
- `target_platform`: 目标平台（`web` / `ios` / `android` / `mini-program`）
- `output_format`: 输出格式偏好（`tailwind` / `css-variables` / `scss` / `swiftui` / `xml`）

## 工作流

### Step 1 — 素材读取与优先级判定

1. 读取所有 `source_files`。
2. **矛盾检测**：如果不同素材对同一 token 给出不同值（如 DESIGN.md 说按钮是 pill，但 code.html 显示矩形），按 `source_priority` 裁决。
   - 默认优先级：`code` > `screenshot` > `design-doc`（代码实现和截图比文字描述更可信）
3. 在报告中标注所有检测到的矛盾及裁决结果。

### Step 2 — 颜色系统提取

从素材中提取并分类：

| 分类 | 提取内容 | 示例 |
|---|---|---|
| **表面色** | 页面背景、卡片背景、侧栏背景 | `#FFF9EB`、`#FFFFFF`、`#F4EEDB` |
| **文字色** | 主文字、次文字、弱文字、反色文字 | `#1E1C10`、`#4D4732`、`#FFFFFF` |
| **功能色** | 主色（CTA）、次色、第三色、错误、警告、成功 | `#FFD700`、`#006D36`、`#BA1A1A` |
| **容器色** | 按钮背景、输入框背景、选中态背景 | `#FFD700`、`#FFF9EB` |
| **Agent/角色色**（如适用） | 不同角色的标识色 | 鲁迅 `#8B4513`、林黛玉 `#FFC0CB` |

**输出格式**：

```markdown
| Token | Hex | 用途 |
|---|---|---|
| `bg-base` | `#FFF9EB` | 页面主背景 |
| `text-primary` | `#1E1C10` | 正文文字 |
```

### Step 3 — 字体系统提取

| 维度 | 提取内容 |
|---|---|
| **字族** | 标题字体、正文字体、等宽字体、中文回退 |
| **字号阶梯** | xs / sm / base / lg / xl / 2xl / 3xl 对应的像素值 |
| **字重** | 每个字号对应的 font-weight |
| **行高** | 每个字号的 line-height |
| **字间距** | 特殊场景（如大标题的 letter-spacing） |

> 🔧 **中文适配**：如果素材是英文设计（如英文网站模板），**MUST** 给出中文字体回退建议（如 Newsreader → Source Han Serif SC）。

### Step 4 — 间距、圆角、边框、阴影提取

| 维度 | 提取内容 |
|---|---|
| **间距阶梯** | 基础单位（如 4px）及其倍数 |
| **圆角** | sm / md / lg / full 对应的像素值 |
| **边框** | 标准边框宽度、主焦点元素边框宽度、边框颜色 |
| **阴影** | 阴影类型（硬阴影 / blur 阴影）、偏移量、颜色、透明度 |
| **装饰性元素** | 背景底图、几何图形、渐变（如有） |

### Step 5 — 关键组件规范提取

从素材中提取至少以下组件的规范：

- **按钮**：背景、文字、边框、圆角、hover 态、active/按下态
- **卡片/气泡**：背景、边框、阴影、内边距、圆角
- **输入框**：背景、边框、聚焦态、占位符颜色、光标样式
- **列表项**：默认态、hover 态、选中态、边框
- **标签/Chip**：形状、圆角、边框、背景
- **头像/标识**：形状（圆形/方形）、尺寸、边框、是否有阴影
- **状态指示器**：加载中、错误、成功的视觉表现

每个组件 **MUST** 以表格形式输出规范，并附代码片段。

### Step 6 — 图标方案提取

| 检查项 | 输出 |
|---|---|
| 图标库名称 | 如 Material Symbols Outlined、Lucide、SF Symbols |
| 图标尺寸 | 默认 16/20/24/32 |
| 描边宽度 | 1px / 1.5px / 2px |
| 颜色规则 | 跟随文字色 / 固定色 |
| 风格 | 线性 / 填充 / 双色 |

### Step 7 — 防退化清单生成

基于提取出的规范，生成一份 **MUST NOT** 清单，防止后续实现中偏离设计意图：

```markdown
### 防退化清单（MUST NOT）

1. **MUST NOT** 使用 {禁止的样式}（如 blur 阴影、浅灰细边框）
2. **MUST NOT** 将 {组件 A} 做成 {错误形态}（如按钮做成 pill）
3. **MUST NOT** 使用 {错误的标识方式}（如用 emoji 圆圈代替颜色名标签条）
...
```

### Step 8 — 代码实现建议

根据 `target_platform` 和 `output_format`，输出可直接使用的代码：

**Web + Tailwind 示例**：

```javascript
// tailwind.config.ts 扩展
theme: {
  extend: {
    colors: {
      'bg-base': '#FFF9EB',
      'text-primary': '#1E1C10',
      // ...
    },
    fontFamily: {
      'heading': ['Newsreader', 'Source Han Serif SC', 'serif'],
      'body': ['Inter', 'Source Han Sans SC', 'sans-serif'],
    },
    boxShadow: {
      'neo': '4px 4px 0 0 rgba(0,0,0,1)',
    },
  },
}
```

## 输出格式

```markdown
# Design Token 提取报告

## 1. 素材来源与矛盾裁决
（列出所有素材及检测到的矛盾）

## 2. 颜色系统
（Token 表格）

## 3. 字体系统
（字族、字号阶梯、行高表格）

## 4. 间距、圆角、边框、阴影
（Token 表格 + 代码片段）

## 5. 关键组件规范
（每个组件一张表格 + 代码片段）

## 6. 图标方案

## 7. 防退化清单（MUST NOT）

## 8. 代码实现建议
（按 target_platform 输出）
```

## 防退化规则

1. **MUST NOT** 仅凭一张截图就推测未显示状态的样式（如 hover 态）。如果素材中没有，**MUST** 标注"未提供，建议补充"或给出合理推断并标注置信度。
2. **MUST NOT** 将设计稿中的装饰性元素（如背景图案）误认为功能性元素。
3. **MUST** 区分"设计稿宣称的"和"代码实际实现的"——当两者矛盾时，默认以代码实现为准，但 **MUST** 在报告中标注矛盾。
4. **MUST** 对提取出的颜色做对比度检查（WCAG AA 标准），标注可能存在的可读性问题。
