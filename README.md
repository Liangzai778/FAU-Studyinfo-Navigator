# FAU Study Navigator

[![CI](https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/actions/workflows/ci.yml/badge.svg)](https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

面向 FAU（Friedrich-Alexander-Universität Erlangen-Nürnberg）学生的**本地优先**学习导航与个人规划工具。无后端、无账号、无遥测，所有个人数据只存在你自己的浏览器里。

**在线使用：** https://fau-studyinfo-navigator.pages.dev

> 独立学生工具，与 FAU 没有官方隶属或认可关系。考试报名、课程注册、成绩、学分认定以及具有法律效力的要求，一律以 FAU 官方文件和 Campo 为准。

---

## 这个项目现在覆盖什么

**本项目主要聚焦自然科学学院（生物系）的三个硕士专业。** 这不是「还没做完」，而是当前版本的明确范围：每一条学业规则都必须对照官方考试条例逐条转录、并经过人工核实，没有捷径。

| 专业 | 学位 | 当前 PO | 已录入模块 | 状态 |
|---|---|---|---|---|
| 细胞与分子生物学 Cell and Molecular Biology | M.Sc. | FPO BAMA Bio 2026（另有 2019 版仅登记来源） | 13 | 已核实 |
| 整合生命科学 Integrated Life Sciences | M.Sc. | FPO BAMA ILS 2026 | 32 | 已核实，逐模块对照 SoSe 2026 模块手册 |
| 整合免疫学 Integrated Immunology | M.Sc. | FPO iImmune 2026 | 11 | 已核实（1 个模块 ECTS 待确认） |

数据包里共 **56 个模块、15 个要求组、4 个 PO 版本、17 条官方来源**。

### 其他学院？还没有，位置留给你

人文、经济、医学、工程四个学院，以及自然科学学院的其余专业，**目前完全没有培养计划与 PO 数据**。应用不会编造它们，而是明确显示「该学院尚未录入」并给出贡献入口。

这是有意设计的扩展点：

- 数据集中在 [`src/data/academic/academic-data.json`](src/data/academic/academic-data.json)，不需要改 React 组件；
- 首页的「当前数据覆盖范围」直接从数据推导，录入后自动从「待补充」变成「已录入」；
- 具体步骤见 **[docs/ADDING_A_FACULTY.md](docs/ADDING_A_FACULTY.md)**，一次录一个专业就够；
- 也可以只提交资料：[「我的学院缺失」issue 模板](.github/ISSUE_TEMPLATE/faculty-data.yml)。

---

## What this is (English)

A local-first study planner and resource navigator for FAU students. It has no
backend, no accounts and no analytics; every personal record stays in the
browser's IndexedDB or localStorage.

**Coverage is deliberately narrow:** the data package transcribes the
examination regulations and module tables of three master programmes in the
Faculty of Sciences, Department of Biology (Cell and Molecular Biology,
Integrated Life Sciences, Integrated Immunology). Every other faculty is empty
and shows an explicit "not entered yet" notice instead of guessed rules.

The extension point is the data file, not the UI: see
[docs/ADDING_A_FACULTY.md](docs/ADDING_A_FACULTY.md) and
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## 功能

- 六个页面：概览、专业要求、学期规划、考试与期限、校园导航、设置，外加 404。
- 专业要求按 `学位类型 + 学院 + 专业 + 入学学期 + PO 版本` 解析；系统不会替你选中「最新 PO」。
- 规则按树形渲染：父组显示 ECTS 与子组，子组列出模块、ECTS 与开课学期；每张卡片附官方来源。
- 验证状态可见：已核实 / 暂定 / 待复核 / 未核实 / 来源冲突。
- 学期规划：课程目录选择器（带模块代码、ECTS、开课学期、可计入的要求组）、手动录入额外课程、重修记录。
- 08:00–21:00 周课程表：一门课可跨多个星期、每个星期独立时间、冲突高亮、剩余时间提示。
- ECTS 引擎（纯函数，有测试）：区分 planned / enrolled / passed / failed / recognized；规则不完整时结论保持 `unknown`。
- 考试与学习任务、`Europe/Berlin` 墙钟校验（含夏令时边界）、本地生成 ICS。
- 30 条资源、7 个分类（含 17 条国际学生资助与支持入口）、机会徽章、按截止日排序、收藏与自定义网站。
- 版本化 JSON 备份导出与恢复，带大小、结构、冲突校验；设置页可二次确认清空本地数据。
- 严格 CSP、无 CDN/远程字体/远程脚本、禁止后台远程请求（有静态扫描测试保护）。
- 简体中文默认，英文完全对等（键集不一致会导致测试失败）。

## 技术栈

React 19 · Vite 8 · TypeScript strict · Tailwind CSS 4 · React Router 7 · Zod · Zustand · IndexedDB · Vitest · Playwright

领域规则放在 `src/domain/` 的纯函数里，React 组件不承担学分或 PO 判断。

## 本地开发

要求 Node.js `>= 22.13.0`、npm 10+。

```bash
npm ci
npm run dev      # http://127.0.0.1:5173
```

始终使用 `127.0.0.1`，不要和 `localhost` 交替访问：浏览器视为不同站点，你会看到不同的本地数据。

### 质量门禁

```bash
npm run lint
npm run typecheck
npm run test        # 静态检查 32 项 + 单元测试
npm run test:data   # 学术数据引用完整性、PO 范围、ECTS 算术
npm run test:e2e    # 需要先执行 npx playwright install chromium
npm run build
```

E2E 会自己构建并用 `npm run preview` 起服务，测试的是真实生产包。

## 部署

纯静态前端，构建产物在 `dist/`。生产环境使用 Cloudflare Pages（`wrangler.jsonc` 中 `not_found_handling: "single-page-application"`）。

```bash
npm run build
npx wrangler pages deploy dist --project-name fau-studyinfo-navigator
```

**不要给 Cloudflare 生成 `dist/404.html`。** Cloudflare Pages 会把它当作权威的 404 响应体，导致 `/degree` 等深链接返回 404 状态码。这个坑已经踩过并写进 `scripts/postbuild.mjs` 的注释。

### GitHub Pages 镜像

`main` 每次推送会顺带部署一份 GitHub Pages 镜像：
https://tommy2345-art.github.io/FAU-Studyinfo-Navigator/

GitHub Pages 没有服务端 SPA 回退，只能靠根目录的 `404.html`，因此该镜像的深链接（如 `/degree`）**返回 404 状态码但页面能正常渲染**。这是平台限制，Cloudflare 上不存在这个问题。需要干净的 200 状态码和搜索引擎收录时用主站。

## 数据来源与真实性

- 每条规则绑定至少一个 `AcademicSource`，来源必须是 HTTPS 官方地址。
- 无法确认的数值保持 `null`：例如整合免疫学的「项目工作研讨课」ECTS 至今未确认，界面会显示「ECTS 待确认」而不是猜一个数字。
- 2019 版 ZMB 条例只登记来源、未转录模块表；选中它的老生会看到「此版本尚未逐条录入……你的选择仍然有效」，而不是「没有规则」。
- ILS 的 32 个模块逐条对照 SoSe 2026 模块手册，手册 SHA-256、页码和 35 条断言都在测试里，数据与 PDF 漂移会直接让构建失败。
- 「schema 通过」不等于「内容真实」；只有人工复核后才能标 `verified`。

官方 PDF 与手册存放在 `sources/`，用于核对，版权归 FAU，不在 MIT 许可范围内。

## 数据存储位置

| 数据 | 位置 |
|---|---|
| 语言、主题 | `localStorage: fau-study-navigator.preferences.v1` |
| 资源范围、排序、收藏、自定义分类与网站 | `localStorage: fau-study-navigator.resources.v1` |
| 专业范围与已确认 PO | IndexedDB `academic-profile` |
| 课程、学期时间与重修记录 | IndexedDB `planner-courses` / `planner-attempts` |
| 个人考试与学习任务 | IndexedDB `personal-exams` / `study-tasks` |
| 学院、来源与学业规则 | 随构建发布的只读数据包 |

所有个人数据都在当前浏览器。换设备看不到，清站点数据会丢；迁移用设置页的 JSON 备份。

## 贡献

欢迎三类贡献：

1. **补你所在学院的数据**（最有价值）：[docs/ADDING_A_FACULTY.md](docs/ADDING_A_FACULTY.md)
2. **纠错**：用「Wrong academic data」模板，给出官方链接和页码
3. **改代码 / 翻译 / 文档**：[CONTRIBUTING.md](CONTRIBUTING.md)

唯一不能破的规则：**不猜测学术数据**。看起来合理的 ECTS 比一个明显的空白更危险。

## 许可证

代码以 [MIT License](LICENSE) 发布。FAU 官方文件与手册版权归 FAU，不在此许可范围内，详见 [NOTICE.md](NOTICE.md)。

## 已知限制

- 只覆盖自然科学学院生物系的三个硕士专业；其余学院与专业为空。
- 2026/27 冬季学期之前入学的 ZMB 学生只能看到「旧版未转录」的提示，看不到 2019 版模块表。
- 整合免疫学的「项目工作研讨课」ECTS 未确认，界面显示「ECTS 待确认」且该模块不计入学分。同组其余三个模块刚好凑满 35 ECTS，所以它不会单独卡住毕业判断，但这一项仍需对照 iImmune 模块手册补齐。
- 没有 FAU 登录、Campo/StudOn 读取、考试报名、多设备同步或自动更新；学术数据随版本发布，不联网抓取。
- 备份暂不含界面偏好与资源自定义数据。
- 弹窗具备语义与键盘操作，但未完成独立屏幕阅读器与 400% 缩放的人工认证。
- 学术数据的「每字段证据」（RuleEvidence）尚未实现，PDF 改版后无法逐字段 diff。

## 历史文档

- [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) — 项目日志与决策记录
- [docs/SCALABILITY_AUDIT.md](docs/SCALABILITY_AUDIT.md) — 源码级审计
- [docs/ACADEMIC_DATA_MODEL.md](docs/ACADEMIC_DATA_MODEL.md) — 数据模型
- [docs/DATA_POLICY.md](docs/DATA_POLICY.md) — 数据政策
- [upload/PRD(1).md](<upload/PRD(1).md>) — 最初的需求文档（保留原样）
