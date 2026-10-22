# FAU Study Navigator — 产品需求说明（PRD）与 Codex 开发蓝图

> 制作日期：2026-10-21。独立学生项目，非 FAU 官方服务。
> 目标：为 Friedrich-Alexander-Universität Erlangen-Nürnberg 的本科生、硕士生提供按专业及考试条例版本定制的官方信息导航、ECTS 学分追踪、学期规划和考试提醒。

## 0. 工作区说明与开发执行要求

本文件的**正确存放位置为项目仓库的 `docs/PRD.md`**。如果你从空目录开始，请直接初始化全新 Vite + React + TypeScript 项目，不要等待外部仓库源码。默认界面为简体中文，英文必须完整可切换。先实现 Phase 0 + Phase 1；不要以“只输出计划”代替实际开发。

## 1. 产品愿景与不可妥协的原则

一句话：Your degree. Your plan. One place.

优先级：**准确性 > 简洁易用 > 信息覆盖广度 > 自动化**。用户应该在 3 次以内点击抵达官方办事入口；每一条涉及学分、考试、毕业的结构化规则必须能够追溯至官方来源和适用版本。

- 导航与规划辅助，不代替 Campo、StudOn，也不处理考试报名、课程报名、成绩认证。
- 首版不需要 FAU 账号/密码、FAU 单点登录、后端、用户账号或第三方跟踪。
- 学院与专业分开建模。核心选择项是 degree type + faculty + degree program + start semester + valid Prüfungsordnung (PO) version；方向、附加条件视专业选填。
- 用户不能确定自己的 PO 版本时引导：Campo → Studienservice → Meine Studiengänge，**不要自动假定最新版本适用**。
- 不能确认的必修学分、考试时限、模块所属类别，标为 unknown/unverified，不能使用貌似真实的占位数值。
- 所有正式的学分数据均依据用户手动输入或经过证实的来源；课程“计划修读”与“实际获得”绝不混淆。
- **界面默认语言为简体中文（zh-CN）**，完整支持英语（en）一键切换；保留必要的 FAU 官方德文术语（如 Prüfungsordnung、Modulhandbuch、Campo），不能只翻译首页。浏览器语言首次可作为建议，但默认必须中文。德语全量翻译后续实现。
- 所有用户个人数据默认在本机。提供 JSON 导入/导出与彻底清空功能，禁止以分析服务收集成绩、学籍和课程清单。
- 页脚明显标注独立学生工具，与 FAU 无官方隶属或认可关系；考试及法律问题以 FAU 的官方文件和 Campo 为准。

## 2. 与 Seu-Web-Navigator 的关系

参考项目：https://github.com/dongbaiwei/Seu-Web-Navigator

仅参考 UX 思想：按学院适配、门户卡片、分类与收藏、响应式卡片、自定义链接与浏览器本地保存。不要以此为事实数据来源；不要照搬 38 学院结构（FAU 为 5 学院）或复制大量代码、图片、Logo。复用源码前核验实际许可。建议在全新仓库按下述需求独立实现。

## 3. 真实 FAU 信息结构与权威来源

### 3.1 学院

五学院：Faculty of Humanities, Social Sciences, and Theology; Faculty of Business, Economics, and Law; Faculty of Medicine; Faculty of Sciences; Faculty of Engineering。
官方页：https://www.fau.eu/university/university-organization/faculties/

### 3.2 官方站点

- Campo https://campo.fau.de — 学籍、考试报名/退报、成绩、模块结构；**真实报名只在官方系统**。
- StudOn https://www.studon.fau.de — 课程资料和课程活动报名。
- StudOn-Exam https://www.studon-exam.fau.de — 数字化考试。
- IdM https://www.idm.fau.de — 身份管理。
- University Library https://www.ub.fau.de — 图书馆。
- 考试条例总入口 https://www.fau.de/universitaet/universitaetsorganisation/rechtliche-grundlagen/pruefungsordnungen/
- 学年重要日期 https://www.fau.de/studium/bewerbung-und-zulassung/alle-fristen-und-termine/
- 考试窗口 https://www.fau.de/glossary/anmeldezeitraeume-fuer-pruefungen/
- Campo 模块描述使用说明 https://www.fau.de/studium/studienorganisation/studienstart/stundenplan-und-vorlesungsverzeichnis/modulbeschreibungen-in-campo-suchen-und-anzeigen/
- Campo 学习规划与考试官方指南 https://www.fau.de/studium/studienorganisation/pruefungen/pruefungen-und-wahlfaecher-im-studienplaner-mit-modulplan-in-campo-verwalten/
- 新生 FAQ https://www.fau.de/studium/studienorganisation/studienstart/faqs-zum-studienstart-und-zum-ersten-studienjahr/faqs-semesterbeginn/

### 3.3 已核实的 2026/27 信息（可作经过标注的正式种子）

- WiSe 2026/27 学期 2026-10-01 至 2027-03-31；授课期 2026-10-12 至 2027-02-05。
- 常规考试报名 2026-11-16 00:01 至 2026-12-06 23:59，**截至 2026-10-21 官方标注 voraussichtlich（预计）**；注意不覆盖专业特殊报名、补考与口试等。
- FAU 官方说明自 WS 2024/25 起不再强制自动报名补考，用户须自行在 Campo 核查与报名。
- 所有日期按 Europe/Berlin 储存和显示，不能用访客的电脑时区错误换算日期。

## 4. MVP 用户群、典型任务与页面

### 4.1 用户

A. 2026/27 新生 Master：不知道入口、专业条例和选课顺序；B. Bachelor 在校生：要完成强制模块、GOP（若适用）、ECTS 和考试；C. 学长/社区志愿者：帮助维护官方来源链接、报告过时记录（不直接改已发布规则）。

### 4.2 页面导航（核心不超过六项）

1. Dashboard（首页）：当前计划、获得/计划的 ECTS、待办时间线、常用快捷链接、未核实信息提醒。
2. Degree requirements（专业要求）：PO 版本、毕业总学分（若已核实）、必修/选修/论文要求、证据与来源、状态。
3. Semester planner（学期规划）：课程目录、添加到学期、计划 ECTS、完成/认定与排期。不可冒充实时开课目录。
4. Exams & deadlines（考试和截止日期）：官方日期、用户自定义考试提醒、报名状态（由用户自己标记）与 Campo 跳转、ICS 导出。
5. Resources（校园导航）：按 Study, Exams, University Services, Faculty, Life 分组、搜索、收藏与用户自定义网站。
6. Sources & updates（来源和更新）：来源可信度、适用学期与 PO、最后人工核实、变化与待确认提醒。

设置项放顶部头像图标/侧边抽屉：专业选择、语言、JSON 备份、主题、数据清空、反馈。

### 4.3 首次使用向导

Step 1 学位 Bachelor/Master → Step 2 五学院 → Step 3 专业（仅选择已核实/明确处于演示状态者）→ Step 4 入学学期 → Step 5 PO 版本（用户确认 Campo）→ Step 6 开始使用。
若没有专业结构化规则，照样允许“通用模式”访问导航、个人规划与自定义提醒，但学分规则分析显示 **Not verified for your program**，绝不假装自动计算毕业满足率。

## 5. 业务规则与算法约束

### 5.1 学分

- ECTS 总数只允许由已通过 passed 和**正式确认** recognized 的不重复课程计入；planned、enrolled、examRegistered、failed 不增加 earned ECTS。
- `isExamRegistered` 不可作为课程完成状态；考试报名状态独立为 `not_registered | user_marked_registered | confirmed_by_user | unknown`，无 Campo 自动验证。
- 一门课程不能同时计入两项互斥的毕业要求；多个需求组可以有包含/上层关系，聚合时防双计。
- 必修/选修/论文/实习等不按统一模板硬编码。应使用可版本化 Requirements，组带 min/max/eligibleModules、前置条件和来源。无法判定的条件单独列明，暂停自动验证。
- 只有当 required ECTS 和每个 rule group 都有经过验证的规则时才显示“预计满足毕业要求”（且注明只是辅助校验）；不能判定则显示“部分规则未核实”。
- 有 moduleId 相同但版本不同的课程，需要 `moduleVersionId` 或有效学期，不能默默合并。
- 用户允许设置每学期 `targetEcts`，不暗示统一标准一定适合各专业。

### 5.2 考试/重要日期

- 日期字段存 `Europe/Berlin`，ISO local date/time、`status: confirmed | tentative | unknown`、`scope: university | faculty | program | module`、`sourceId`、`lastVerifiedAt`。
- 只有明确属于当前专业范围的 deadline 才展示为“适用于你”；其余是“通用信息，请核对”。
- 普通报名窗口不覆盖有独立时间安排的活动、口试或第二次考试。
- 可在时间线中标记“我已在 Campo 报名”，但页面不能写“已自动报名成功”。
- 用户在考试/行政通知里可以设置本地提醒事件，首版仅支持站内提醒或 ICS 下载；若浏览器不支持持续通知，不承诺后台推送。
- 日历导出必须避免重复事件，并给清晰的本地时区和提醒警告。

### 5.3 信息来源

每条重要规则与日期附一个或多个 `Source`：URL、title、publisher、documentType、validForProgram、poVersion、semester、lastCheckedAt、lastVerifiedAt、verificationStatus、notes（必要时加 document section/page）。

大致证据层级：适用的正式 Prüfungsordnung 与过渡条款（有法律效力）→ 对应专业/学期的官方模块手册和 Campo → 官方学院/专业公告 → FAU 通用日期 → 学生社区经验。冲突时标记 `conflict` 并邀请用户核对，不允许静默覆盖官方规定；逐项确认例外规则。

更新时间与有效时间不同：`lastCheckedAt` 代表是否访问过网页，**不代表条文已经人工核准**。仅在人工复核完成后更新 `lastVerifiedAt`，文档 hash 变化标为 needs_review，保留旧记录直到审核通过。

## 6. 推荐技术栈与架构

### MVP 静态优先，不做过度工程

- Vite + React + TypeScript (strict)
- Tailwind CSS + shadcn/ui (如依赖过大可改 Headless Components)
- React Router (URL 路由)
- Zustand 负责本地用户状态（或 React Context，避免多种 state 库混用）
- Zod 进行运行时数据校验
- Dexie (IndexedDB) 储存学习记录；localStorage 仅储存非敏感轻量界面设置
- date-fns（显式 Europe/Berlin 的时区处理，可选 date-fns-tz）
- Vitest + Testing Library 做规则测试；Playwright 做主要用户流程 e2e
- GitHub Pages / Cloudflare Pages 部署静态前端（由环境配置 base path）
- GitHub Actions 定期检查公开来源的可访问性和内容变化，生成 issue/PR 供人工审核；绝不依赖 FAU 用户凭据和绕开防爬策略。

### 数据分层

Public versioned seed data（GitHub repo JSON）→ Zod 验证 → 公共数据仓库逻辑 → React UI；个人进度在 IndexedDB，不写回公共资源 JSON；Source Monitoring 仅识别差异，人工审核后修改 versioned seed。第二阶段如果大量专业需要维护，再考虑 Supabase/PostgreSQL 和带权限的审稿后台。

### 推荐目录

```text
fau-study-navigator/
  src/
    app/{App.tsx,router.tsx,providers.tsx}
    components/{layout,ui,common}/
    features/
      onboarding/
      dashboard/
      degree-requirements/
      semester-planner/
      exams/
      resources/
      sources/
      settings/
    domain/{models.ts,credit-engine.ts,requirements-engine.ts,deadlines.ts}
    data/{faculties.json,resources.json,semesters.json,sources.json,programs/}
    storage/{db.ts,preferences.ts,backup.ts,migrations.ts}
    i18n/{zh-CN.json,en.json}
    lib/{format.ts,validation.ts,dates.ts}
  scripts/{validate-data.ts,check-public-sources.ts}
  tests/{unit,e2e,fixtures}/
  docs/{PRD.md,DATA_SOURCES.md,MAINTENANCE.md,DISCLAIMER.md}
  .github/workflows/{ci.yml,check-sources.yml,deploy.yml}
  README.md
```

## 7. 核心类型示意（非完整实现）

```ts
type VerificationStatus = 'verified' | 'tentative' | 'needs_review' | 'unverified' | 'conflict';
type CreditStatus = 'planned' | 'enrolled' | 'passed' | 'failed' | 'recognized';
type ExamRegistration = 'unknown' | 'not_registered' | 'user_marked_registered';

type Source = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  documentType: 'regulation' | 'module_handbook' | 'campo' | 'official_notice' | 'guide';
  lastCheckedAt?: string;
  lastVerifiedAt?: string;
  verificationStatus: VerificationStatus;
};

type Programme = {
  id: string;
  facultyId: string;
  degreeType: 'bachelor' | 'master';
  name: string;
  officialUrl?: string;
  supportedPoVersionIds: string[];
  dataStatus: 'verified' | 'partial' | 'placeholder';
};

type PoVersion = {
  id: string;
  programmeId: string;
  code: string;
  officialUrl: string;
  effectiveFrom?: string;
  applicabilityNotes?: string;
  sourceIds: string[];
};

type RequirementGroup = {
  id: string;
  poVersionId: string;
  name: string;
  kind: 'mandatory' | 'restricted_elective' | 'elective' | 'thesis' | 'internship' | 'other';
  minEcts?: number;
  maxEcts?: number;
  eligibleModuleIds?: string[];
  exclusiveCounting: boolean;
  verificationStatus: VerificationStatus;
  sourceIds: string[];
};

type Module = {
  id: string;
  programmeId: string;
  name: string;
  ects?: number;
  moduleVersion?: string;
  semestersOffered?: ('WS' | 'SS')[];
  offeringStatus: 'verified' | 'historical' | 'unknown';
  sourceIds: string[];
};

type StudentModuleRecord = {
  moduleId: string;
  plannedSemester?: string;
  creditStatus: CreditStatus;
  examRegistration: ExamRegistration;
  recognizedEcts?: number;
  lastUpdatedAt: string;
};

type Deadline = {
  id: string;
  title: string;
  start: string;
  end?: string;
  timezone: 'Europe/Berlin';
  scope: 'university' | 'faculty' | 'programme' | 'module';
  targetId?: string;
  status: 'confirmed' | 'tentative' | 'unknown';
  sourceIds: string[];
  lastVerifiedAt?: string;
};
```

实践中使用 Zod 定义运行时 Schema 并派生 TypeScript 类型；对于 requirements-engine 未能确认的规则返回 `unknown` 而不是 false pass。

## 8. 数据更新实施机制（必做）

1. 建立官方 URL registry，标注 scope、来源类型、频率、是否允许机器访问。
2. GitHub Actions 定期请求允许公开访问的 HTML/PDF（遵守站点 robots、访问条款及限制，使用条件请求/合理间隔，不能访问受认证保护页面）。
3. 记录 ETag/Last-Modified/normalized content hash；地址损坏生成 issue。
4. hash 变化只能产生 `needs_review` issue/PR（包含旧新来源与差异摘要）。**不能自动用 AI 抽取的数值覆盖发布中的 ECTS 或考试规定**。
5. 维护者逐条核对原文和适用 PO/入学 cohort 后，提交可审计 PR；CI 校验数据和变更。
6. 展示数据的 `validFor`、`lastVerifiedAt` 和 `status`；过时项目降级为提示核对，而不是“已确认”。
7. 对无允许抓取途径的来源，保持人工周期性复核；不声称“自动实时同步 Campo”。

## 9. MVP 里程碑与验收

### Phase 0（搭骨架）
Vite、React/TS strict、Tailwind、路由、五学院目录、导航资源数据、README、CI。验收：`npm run lint && npm run typecheck && npm run test && npm run build` 全通过，页面手机桌面正常，外链安全。

### Phase 1（核心导航与用户体验）
欢迎向导、通用模式、专业+PO 版本手动选择、门户分类/搜索/收藏、自定义入口、i18n zh-CN/en（中文默认）、主题、来源页面。验收：刷新、跨路由切换和重启仍保留设置；不能选择未验证项目自动判定学分。

### Phase 2（ECTS 与学期规划）
Versioned 需求和模块类型、课程添加/移动/完成、ECTS 计算、requirement engine、来源显示、JSON 备份恢复。验收：planned、failed、registered 不计入 earned；相同模块不重复计学分；未知毕业要求不出现“符合毕业”结论；回归迁移不丢数据。

### Phase 3（考试/截止日期）
FAU 官方 WS 2026/27 数据（预计标签）、项目级 override、时间线、用户自填考试报名状态、ICS。验收：日期状态清晰；Europe/Berlin 正确；不创建虚假截止日期或声称已报名。

### Phase 4（维护与发布）
数据验证脚本、公开来源变更检测（仅在允许访问时启用）、review issue，E2E，a11y，隐私/免责说明，静态部署。验收：变化不自动发布法规内容，所有重要规则在 UI 可点来源，响应式与键盘操作可用。

### Phase 5（后续可选）
先完成 1 个真实且人工核实的专业，再逐步扩展到其他专业；只在治理体系稳定后考虑账号、云同步、学校授权的 API 与 AI 问答（必须引用官方内容并明确不确定性）。

## 10. 主 Codex 提示词（复制到 Codex）

```text
You are a senior full-stack TypeScript engineer, UX designer, and meticulous maintainer of student-facing academic planning tools.

Build a new, independent, mobile-first project named FAU Study Navigator, intended for bachelor's and master's students at Friedrich-Alexander-Universität Erlangen-Nürnberg (FAU). Use the product requirements and constraints in this repository's docs/PRD.md as the primary implementation specification.

Goal: Make fragmented FAU study resources navigable and let students manually plan their semesters, track ECTS and exam-related deadlines, always scoped to their actual degree program and applicable examination regulation (Prüfungsordnung / PO) version. Prioritize trustworthiness and simplicity over feature count.

Reference inspiration: https://github.com/dongbaiwei/Seu-Web-Navigator. Borrow high-level ideas (faculty-specific navigation, favorites, categories, browser-local customization), but DO NOT blindly copy source files or assets. Verify licensing before any code reuse.

Mandatory rules:
1. The product is independent and unofficial; clearly show a disclaimer. Official FAU sources and Campo prevail for legally binding regulations, course enrollment, exam registration, and grades.
2. There are five FAU faculties. A degree program and a PO version, not only a faculty, define requirements. PO version is chosen/confirmed by the student; do not assume the newest version applies.
3. Do not fabricate modules, credit amounts, exam dates, prerequisites, graduation rules, offering periods, or source citations. Demo-only data must be visibly marked synthetic. Unknown or unverified data must render as unknown; do not calculate false completion conclusions.
4. Source metadata is required for every important academic rule and deadline: source URL, document type, applicable cohort/PO, validity, last checked, last human verified, confirmation status.
5. Separate planned, enrolled, passed, failed and officially recognized course outcomes; exam registration is a separate user-entered field. ECTS earned only counts passed or confirmed recognized credits, with no double-counting across requirement groups.
6. Never request, store or automate FAU SSO credentials; do not scrape logged-in Campo/StudOn. Never claim to have performed exam registration. All personal data stays local in MVP, with JSON export/import/delete.
7. Store and render FAU deadlines in Europe/Berlin and distinguish tentative from confirmed. Winter 2026/27 standard registration dates published on FAU are TENTATIVE as of 2026-10-21; do not silently convert them to confirmed.
8. Design for progressive expansion from general navigation plus one demo program to multiple verified degree programs. Prefer a maintainable schema with explicit versioning, not hardcoded academic data embedded in React components.

Stack: Vite, React, TypeScript strict, Tailwind CSS, React Router, Zod, IndexedDB via Dexie for personal study data, localStorage for theme/settings, Vitest, Testing Library, Playwright. No production backend/auth in MVP. GitHub Actions for CI and a separately reviewed source-change monitor.

UX: Clean FAU-inspired but non-official visual style, generous whitespace, compact cards, accessible keyboard controls, responsive mobile-first UI, Simplified Chinese (zh-CN) as the default UI with complete English (en) translations, preserve official German terms. Keep primary navigation to Dashboard, Degree Requirements, Semester Planner, Exams & Deadlines, Resources, Sources & Updates. An onboarding wizard allows Bachelor/Master → faculty → program → entry semester → PO version; allow General Mode when official degree structure is not verified.

First action: inspect the repository and create or update docs/PRD.md, docs/ARCHITECTURE.md, docs/DATA_SOURCES.md, docs/IMPLEMENTATION_PLAN.md. Give a concise gap analysis and milestone plan. Then IMPLEMENT Phase 0 and Phase 1 in actual files, including usable UI, verified generic official FAU resource links, persistence, and tests. Do not stop after planning; create a running application. Leave Phase 2+ as documented follow-ups unless already explicitly requested.

Deliverables: full source code, sample validated data, tests, package scripts, README with exact local commands, usable pages, and a concise report of completed features / outstanding work. After implementation run typecheck, lint, tests, and build. Fix failures. No mock buttons that pretend to work. No invented API integrations.

If an external source is inaccessible, preserve that as a TODO/source status and do not invent the missing facts.
```

## 11. 分阶段 Codex 提示词

### P0 — 梳理已有项目并制定实施计划

```text
Inspect the entire current repository. Compare it to docs/PRD.md. List implemented, partial, missing, unsafe or unverified behaviors. Identify architecture and data consistency risks. Create a prioritized implementation plan with explicit deliverables and acceptance tests. Do not refactor unrelated code. Then implement the next smallest vertical slice rather than producing only a report.
```

### P1 — 导航与首次使用

```text
Implement the FAU onboarding wizard and source-backed portal navigation for the five official faculties. Use Simplified Chinese (zh-CN) by default and provide complete English (en) localization, retaining official German terminology. Provide General Mode, explicit degree-program/PO selection, validation, category search, favorites, and custom links saved locally. Use official FAU URLs with Source references. Show clear labels when programme-specific data is unsupported. Ensure UI works on mobile, desktop and with keyboard. Add tests for onboarding and persistence.
```

### P2 — 学分规划引擎

```text
Implement versioned programme, PoVersion, Module, RequirementGroup, StudentModuleRecord and evidence source schemas with Zod. Build a pure rules engine, keeping it entirely separate from React UI, that calculates earned versus planned ECTS, requirement-group progress, unresolved requirements, and warnings. Count only passed/confirmed-recognized courses as earned. Never double count one module across exclusive requirement groups. Return unknown when verified rules are incomplete. Add tests for PO version changes, repeated attempts, double counting, transfer recognition and empty/unverified catalogues. Build the semester planner UI and local data backup/restore.
```

### P3 — 截止日期与考试

```text
Implement Exam & Deadlines with scope-aware official event data, version/semester filtering, timezone Europe/Berlin, separate tentative/confirmed states, source links, user-entered exam registration checklist and ICS export. Seed only individually verified general FAU events. The Winter Semester 2026/27 standard exam registration window 2026-11-16 00:01 to 2026-12-06 23:59 is explicitly TENTATIVE as of 2026-10-21, not a finalized guaranteed deadline. Never indicate registration in Campo has happened. Add date parsing/timezone/ICS and visibility tests.
```

### P4 — 可信更新机制

```text
Create public source registry, schema/data validator and a GitHub Actions check for changed publicly reachable official pages. Comply with site terms/robots, throttling and conditional requests; never access behind-login services. Normalize permitted source content conservatively, compare ETag/Last-Modified/content hashes, and generate a review issue with URLs and a diff summary. Do not auto-publish source changes or auto-overwrite academic rules. Provide a manual approval flow and include lastCheckedAt vs lastVerifiedAt in the UI. Include tests for missing pages, 403/429, changed hashes, unchanged pages and conflicting versions.
```

### P5 — 发布前质量审核

```text
Act as release engineer and critical academic accuracy reviewer. Run npm run lint, npm run typecheck, npm run test, npm run build and Playwright E2E. Audit all academic labels and citations, accessibility (WCAG basics), keyboard navigation, mobile breakpoints, unsafe URLs, local data export/delete, initialization, migrations, invalid imports, source freshness states, offline/failed networks, and Europe/Berlin daylight saving behavior. Remove invented data or relabel it clearly demo-only. Document known limitations and deploy to a static hosting target. Present a release checklist with pass/fail evidence.
```

## 12. 最值得追加的测试用例

- 已修完 6 ECTS 同一模块同时位于两个可选择学分池，不可在互斥需求中计为 12 ECTS。
- 20 ECTS 计划课程 + 5 ECTS 通过课程 → earned 为 5，不是 25。
- 30 ECTS 毕业论文仅在当前专业 PO 明确核实后可显示真实要求；未验证须显示 unknown。
- WiSe 2026/27 考试报名 tentative 即使临近日历也必须保持 tentative，直到人工核验后通过 PR 修改。
- 从 PO A 切换 PO B 后，学生学习记录不丢失，但是毕业要求按 B 重算，原先的归类需重新审查。
- 用户清空浏览器数据后不再错误显示保留的学分；JSON 导出/导入后能恢复并校验 schema version。
- 公开源返回 403、429 或 PDF 解析失败：不自动删除有效记录、不伪称已更新。
- 只显示匹配用户 program/PO 的 program 专属要求；不把 WiSo 专属期限推送给所有学生。

## 13. 官方参考来源（2026-10-21 核对）

- https://www.fau.eu/university/university-organization/faculties/
- https://www.fau.de/universitaet/universitaetsorganisation/rechtliche-grundlagen/pruefungsordnungen/
- https://www.fau.de/studium/studienorganisation/pruefungen/pruefungen-und-wahlfaecher-im-studienplaner-mit-modulplan-in-campo-verwalten/
- https://www.fau.de/studium/studienorganisation/studienstart/stundenplan-und-vorlesungsverzeichnis/modulbeschreibungen-in-campo-suchen-und-anzeigen/
- https://www.fau.de/studium/bewerbung-und-zulassung/alle-fristen-und-termine/
- https://www.fau.de/glossary/anmeldezeitraeume-fuer-pruefungen/
- https://www.wiso.rw.fau.eu/study/study-organization/services-for-students/module-handbooks/
- https://www.fau.de/studium/studienorganisation/studienstart/faqs-zum-studienstart-und-zum-ersten-studienjahr/faqs-semesterbeginn/
- https://www.fau.de/studium/studienorganisation/pruefungen/
- https://github.com/dongbaiwei/Seu-Web-Navigator
