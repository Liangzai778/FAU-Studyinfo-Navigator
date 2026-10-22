# FAU Study Navigator 测试计划

## 1. 测试目标

测试重点是防止“看起来可用但学术含义错误”。自动化覆盖代码行为、数据契约、隐私、无网络运行和关键用户流程；人工复核负责确认官方来源内容与 PO 适用性。二者缺一不可。

## 2. 测试层级与工具

| 层级 | 目标 | 建议工具 | 网络策略 |
|---|---|---|---|
| 静态检查 | 类型、lint、i18n 键、禁止模式、数据引用 | TypeScript、ESLint、本地脚本 | 禁网 |
| 单元测试 | 规则引擎、日期、校验、迁移、ICS | Vitest | 禁网 |
| 组件测试 | 表单、状态标签、键盘、错误信息 | Testing Library + axe | 禁网 |
| 集成测试 | 仓库、IndexedDB、导入事务、路由状态 | Vitest + fake-indexeddb | 禁网 |
| E2E | Onboarding、规划、提醒、备份、清空、双语 | Playwright | 拦截并拒绝非 localhost 请求 |
| 人工审计 | 来源原文、PO 适用性、文案、视觉与辅助技术 | 复核清单 | 仅维护者主动查阅来源；应用仍不联网 |

测试数据只使用本地 fixture。任何模拟专业/模块必须以 `synthetic-test-only` 命名空间标记，不能进入生产数据包或截图中冒充真实 FAU 数据。

## 3. 通用测试环境

- 固定系统时钟；时区分别运行 `Europe/Berlin`、UTC 和至少一个非欧洲时区，验证展示仍按 Berlin 语义。
- 浏览器：Chromium 为每阶段必跑；P6 增加 Firefox 和 WebKit（本地已有浏览器时）。
- 视口：320×568、390×844、768×1024、1440×900；至少检查 200% 缩放。
- 存储状态：全新、已有当前 schema、逐个旧 schema、空间不足、IndexedDB 不可用。
- 语言：每个关键流程各跑 `zh-CN` 与 `en`；默认首次启动必须为 `zh-CN`。
- 网络：自动化阻止所有非 localhost 请求，并把意外请求视为失败。

## 4. 关键不变量

下列不变量必须由单元或集成测试直接断言：

1. earned 仅包含 passed 和已确认的 recognized。
2. examRegistration 与课程完成状态互不推导。
3. 一个模块不能在互斥需求组重复计分。
4. 不完整或冲突的 verified rule graph 产生 `unknown`，而非 satisfied。
5. PO 切换保留用户记录但重新计算归类。
6. programme 专属 deadline 不会误标为适用于其他 programme。
7. `tentative` 不会因时间流逝、导入或导出自动升级为 `confirmed`。
8. 所有正式规则和期限都有有效 source 引用和明确 scope。
9. 导入失败不改变现有数据；清空后重启不存在个人数据残留。
10. 应用不发起远程请求，也不包含第三方运行时资源。

## 5. 分阶段自动化测试

### P0 — 文档与约束

- 文件存在性：`AGENTS.md` 与四份 `docs/*.md`。
- 关键词/规则检查：本地部署、禁止远程、PO 版本、unknown、中文默认、英文完整、自动化测试。
- 原始 PRD checksum 或只读对比，确保没有删除或改写。

**通过条件：** 所有规划文件齐全；阶段编号 P0–P6 无缺失；每阶段四要素（任务、依赖、交付、验收）存在。

### P1 — 骨架、路由与 i18n

- 六个主路由和 404 smoke。
- 首次启动中文、切换英文、刷新持久化、消息键集合相同。
- 导航 tab 顺序、可见焦点、skip link、键盘激活和移动菜单焦点管理。
- 生产 HTML/JS/CSS 扫描远程 URL、CDN、第三方字体和分析 SDK。
- Playwright 路由层拒绝非 localhost 请求，并断言请求数为零。

**通过条件：** lint、typecheck、unit、组件测试、e2e smoke、build 全通过；无严重 axe 违规。

### P2 — 专业/PO 与来源

- Zod property/fixture 测试：无效 faculty-programme、跨 programme PO、重复 ID、悬空 sourceId、非法状态。
- Onboarding 正常、返回、刷新恢复、取消和 General Mode。
- 入学学期只筛选候选 PO，不自动确认；未核实专业不显示肯定结论。
- source status、lastCheckedAt 与 lastVerifiedAt 分开显示；conflict 保留双方证据。
- 中英文各完成一次全向导，检查无缺失翻译。

**通过条件：** 全部生产数据通过 schema 和引用检查；不存在无 Source 的正式规则；错误组合被 UI 与领域层同时拒绝。

### P3 — ECTS 与规划

> 当前范围说明（2026-10-22）：用户将本轮 P3 定义为 FAU Academic Data Model。本轮先执行原 P2 中的学术 schema、引用完整性、PO 候选匹配、显式确认、General Mode、来源状态与本地 JSON 测试；下列 ECTS 与规划用例顺延，不视为已完成。

核心表驱动用例：

| 输入 | 预期 |
|---|---|
| 20 planned + 5 passed | earned = 5，planned = 20 |
| 同一 6 ECTS 模块可进两个互斥池 | 总 earned = 6 |
| failed 后同模块 passed | 只计一次 passed ECTS，保留失败历史 |
| examRegistered + 未通过 | earned = 0 |
| recognized 但未确认 | earned = 0，给出警告 |
| 规则缺 minEcts 或来源 conflict | 结论 = unknown |
| PO A 切 PO B | 记录保留，按 B 重算，未映射项待审查 |
| 同 moduleId 两个 versionId | 不静默合并 |

- 测试嵌套需求、min/max 边界、空 catalogue、浮点/负数/异常 ECTS 拒绝。
- fake-indexeddb 测试创建、更新、迁移、并发和事务失败。

**通过条件：** 规则引擎分支覆盖率目标 ≥95%，领域核心不变量 100% 用例覆盖；任何 unknown 场景不出现通过文案。

### P4 — 日期、考试与 ICS

> 当前范围说明（2026-10-22）：用户将本轮 P4 定义为 ECTS Engine & Semester Planner。本轮测试计划覆盖重复课程、失败课程、认定确认、PO 不一致、要求组缺少学分、来源未知、重修、额外课程、互斥计分和 IndexedDB 保存恢复；下列日期、考试与 ICS 用例顺延。

- scope 组合矩阵：university、faculty、programme、module 的匹配与非匹配。
- 固定 WiSe 2026/27 tentative fixture，验证时间临近/越过后仍 tentative。
- Europe/Berlin DST 开始与结束日、闰日、全天事件、午夜边界。
- 系统时区设为 UTC/洛杉矶时，官方日期标签仍按 Berlin 解释。
- ICS：稳定 UID、CRLF、特殊字符转义、时区声明、重复事件去重、空结束时间。
- 通知 API 缺失或权限拒绝时降级为站内提醒/ICS，不承诺后台通知。
- 报名勾选只显示用户自报，不出现 Campo 成功语义。

**通过条件：** 日期/ICS 单元测试全通过；专业期限无跨 scope 泄漏；E2E 导出可被解析器重新读取且事件数正确。

### P5 — 备份、隐私与治理

> 当前范围说明（2026-10-22）：本轮 P5 同时承接此前顺延的个人考试、学习任务、Berlin 时间和 ICS，并实现 JSON 备份/合并恢复。官方日期 scope 矩阵、通知权限、彻底清空和旧版本迁移链仍未实现，不能计为本轮通过项。

- JSON round trip：导出 → 清空 → 导入，领域状态等价。
- 旧 schema 逐版本迁移；未来版本拒绝；失败迁移事务回滚。
- 输入攻击：XSS 字符串、`javascript:` URL、prototype pollution key、深嵌套、超大文件、重复 ID、悬空引用。
- 清空覆盖 IndexedDB、localStorage 和内存缓存；重启后仍为空。
- 日志捕获断言不包含课程名、提醒正文或完整导入 payload。
- 数据校验器拒绝无 source、无 PO scope、翻译缺失或非法 verified 提升。
- 个人考试/任务 IndexedDB 往返；无效 Berlin 日期写入前失败且不改变已有记录。
- Europe/Berlin 春季跳时、秋季重复时段、墙钟显示和 ICS 时间格式。
- ICS `VTIMEZONE`、稳定 UID、CRLF、特殊字符转义、重复记录去重，且不输出 `STATUS:CONFIRMED`。
- 备份版本拒绝、畸形状态拒绝、同 ID 冲突零覆盖，以及成功恢复后领域状态等价。

**通过条件：** 所有破坏性操作需明确确认；无效导入零副作用；隐私与安全测试无高严重度问题。

### P6 — 发布候选

- 在干净环境执行：install（使用已批准的本地/锁定依赖来源）、lint、typecheck、test、e2e、build、preview smoke。
- 浏览器矩阵与四种视口；键盘-only；200%/400% 缩放抽查；axe 自动扫描。
- 生产网络录制：除 localhost 文档与静态资产外零请求；用户主动外链不携带个人查询参数。
- 构建产物扫描 secrets、source map、远程域名、调试日志和 synthetic fixture。
- 三条启动路径：全新用户、从上一 schema 升级、备份恢复。
- 人工逐条审查所有正式数值、来源、PO 与免责声明。

**通过条件：** 全部门禁通过，无 P0/P1 严重度缺陷；学术数据审计 100% 完成；本地安装与回退步骤可由另一名测试者复现。

## 6. 手工验收场景

1. 新生不知道 PO：选择专业后看到 Campo 核对指引，可进入 General Mode，不被自动分配最新 PO。
2. 在校生切换 PO：已有课程不丢失，但系统明确要求重新检查归类。
3. 未支持专业：仍能收藏官方入口、规划个人课程和提醒，但毕业进度显示无法核实。
4. 考试提醒：用户创建本地提醒、标记“我已在 Campo 报名”，界面不声称已验证。
5. 数据控制：用户导出、清空、重启确认为空，再导入恢复。
6. 双语一致性：从 onboarding 到设置、错误、空状态、导入确认全程可用英文，切回中文无数据变化。

## 7. 缺陷严重度与发布阻断

| 级别 | 示例 | 处理 |
|---|---|---|
| P0 阻断 | 伪造/错用学术规则、ECTS 双计、个人数据外传、错误声称已报名 | 立即停止发布 |
| P1 严重 | PO 串用、清空不彻底、备份破坏数据、日期跨日、远程请求 | 修复后完整回归 |
| P2 一般 | 某断点布局、非关键翻译、次要键盘问题 | 评估后修复，原则上发布前完成 |
| P3 轻微 | 纯视觉细节、不影响理解的文案 | 可记录到后续版本 |

任何 `verified` 内容缺少有效来源或适用 PO 均至少为 P1；若可能导致错误毕业/考试判断则为 P0。

## 8. 测试证据与可追溯性

- 每条业务规则映射到测试 ID，例如 `CR-EARNED-001`、`PO-SCOPE-002`、`DL-TENTATIVE-001`。
- 每阶段验收记录包含命令、日期、本地环境、结果、失败项和已知限制。
- 学术数据人工审查记录来源、页码/章节、适用版本、审查者检查项与日期，但不包含个人数据。
- 测试报告和截图只保存在当前项目目录；不上传远程平台。

