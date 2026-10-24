# FAU Study Navigator — 项目日志

> 日期：2026-10-24（最近更新，变更历史见第十节）
> 项目路径：`D:\dev\FAU-Study-Navigator`（原 `C:\dev\FAU-Study-Navigator`，已迁移）
> 线上地址：https://fau-studyinfo-navigator.pages.dev
> 仓库：https://github.com/tommy2345-art/FAU-Studyinfo-Navigator（**公开，MIT 许可**）
> 当前状态：工作区干净，`main` 与 `origin/main` 同步
> 覆盖范围：自然科学学院生物系 3 个硕士专业，其余学院留作贡献接口（见第十二节）

---

## 一、项目定位

面向 FAU（Friedrich-Alexander-Universität Erlangen-Nürnberg）学生的**本地优先**学习导航与个人规划工具。

**核心设计约束**（贯穿全项目）：

- 无后端、无云数据库、无遥测、无在线 API
- 所有个人数据只存在用户当前浏览器
- 学术数据必须可追溯到官方来源，未核实的不伪装成已核实
- 默认简体中文，全部界面提供英文版本
- 独立项目，与 FAU 无官方隶属关系

---

## 二、已实现功能（详细）

### 2.1 应用骨架与导航

| 路由 | 页面 | 状态 |
|---|---|---|
| `/` | 学习导航概览（Dashboard） | ✅ |
| `/degree` | 专业要求 | ✅ |
| `/planner` | 学期规划 | ✅ |
| `/exams` | 考试与成绩 | ✅ |
| `/resources` | 资源导航 | ✅ |
| `/settings` | 设置 | ✅ |
| `*` | 404 | ✅ |

- 响应式布局：桌面侧边栏 + 顶部栏 + 平板/手机底部导航
- 深/浅主题切换，语言切换，刷新后保留
- 技术栈：React 19 + Vite + TypeScript strict + Tailwind CSS + React Router + Zod + Zustand
- 国际化：`zh-CN` 默认 + `en` 完整对等，有缺失键自动检查

### 2.2 资源导航（FAU Resources Navigator）

- 五大学院 × Bachelor/Master 筛选
- 资源搜索、排序、收藏置顶
- 用户可添加个人网站与自定义分类（增删改排序）
- 所有外链强制 HTTPS，`noopener` 安全处理
- 数据存 `localStorage: fau-study-navigator.resources.v1`

**已收录的基础资源（13 条，按优先级排序）**：

> 2026-10-24 起另增 17 条国际学生资源（`international` 分类），总条目 30 条、7 个分类。详见第十二节。

| 优先级 | ID | 名称 | 分类 |
|---|---|---|---|
| 10 | `campo` | Campo | 学习 |
| 20 | `studon` | StudOn | 学习 |
| 30 | `studon-exam` | StudOn-Exam | 考试 |
| 40 | `idm` | IdM 身份管理 | 校园服务 |
| 45 | `faumail` | **FAUmail 邮箱** | 校园服务 |
| 50 | `library` | FAU 图书馆 | 校园服务 |
| 60 | `regulations` | 考试条例总入口 | 考试 |
| 70 | `academic-dates` | 学期重要日期 | 考试 |
| 80 | `exam-registration-windows` | 考试报名窗口说明 | 考试 |
| 90 | `module-descriptions-guide` | Campo 模块说明指南 | 学习 |
| 100 | `study-planner-guide` | Campo 学习规划指南 | 学习 |
| 110 | `first-year-faq` | 新生 FAQ | 校园服务 |
| 120 | `faculties-overview` | FAU 五学院概览 | 学院 |

### 2.2.1 首页「常用入口」区块（2026-10-22 新增）

学生每天必开的三个服务直接放在首页，不必先进资源页：

| 入口 | 地址 | 说明 |
|---|---|---|
| FAUmail 邮箱 | `https://faumail.fau.de` | 学校通知、考试与课程邮件 |
| Campo | `https://campo.fau.de` | 选课、成绩与考试报名 |
| StudOn | `https://www.studon.fau.de` | 课程资料与学习小组 |

- 全部 `target="_blank"` + `rel="noopener noreferrer"`
- 区块说明文字明确写出「本工具不会读取你的登录信息」
- FAUmail 未放入左侧主菜单：主菜单是站内功能页，FAUmail 是跳出的外部站点，
  混排会让学生分不清哪些会离开应用

**地址核实方式**：未凭印象填写。从 FAU 官方词汇表 `https://www.fau.de/glossary/webmail/`
抓取链接得出实际 Webmail 地址为 `faumail.fau.de`，来源标注指向该官方说明页。

### 2.3 学术数据模型（P2/P3 重点）

完整的版本化 Zod 模型，包含：

```
Faculty → DegreeType → Programme → ProgrammeTrack
         → ExaminationRegulationVersion (PO)
         → Module → ModuleVersion
         → RequirementGroup
         → AcademicSource
         → RuleVerificationStatus
```

**关键规则**：
- 入学学期只筛选**候选** PO，系统**不会**自动选最新版，必须用户确认
- 每条正式规则必须可追溯到至少一个 `AcademicSource`
- 验证状态分 `verified` / `tentative` / `needs_review`，界面可见
- 数据版本通过 `dataReleaseId` 管理（当前 `2026-10-24.2`）

**当前数据规模**（2026-10-24 实测，脚本核对）：

| 项目 | 数量 |
|---|---|
| 模块（Module） | 56 |
| 模块版本（ModuleVersion） | 56 |
| 要求组（RequirementGroup） | 15 |
| 官方来源（AcademicSource） | 17 |
| 专业（Programme） | 3 |
| 学院（Faculty） | 5 |
| PO 版本（ExaminationRegulationVersion） | 4（含 2019 空壳） |

> 模块数从 65 降到 56：删除了 9 个重复登记、且不属于任何要求组的 ILS 目录条目。现在 56 个模块全部可从要求组到达，见第十二节与 `docs/SCALABILITY_AUDIT.md`。

### 2.4 专业要求页面（本轮重点完成）

**三个已完整录入的硕士专业**（自然科学学院生物系）：

1. **细胞与分子生物学（M.Sc.）** — 13 个模块
   - 必修：基础课与定位模块 (6)
   - 研究模块 (1)
   - 选修：三选一实习或语言模块 (3)
   - 关键能力、学术演讲与硕士论文 (3)

2. **整合生命科学：生物学、生物数学与生物物理（M.Sc.）** — 32 个模块
   - 模块组 1 必修与选修模块 (10) — 核心 15 ECTS
   - 模块组 2 必修与选修模块 (8) — 核心 15 ECTS
   - 模块组 3 必修与选修模块 (11) — 核心 10 ECTS
   - 统计、深化模块与硕士论文 (3)

3. **整合免疫学（精英硕士项目，M.Sc.）** — 11 个模块
   - 必修免疫学模块 (5)
   - 临床免疫学与项目工作 (4)
   - 软技能与硕士论文 (2)

**本轮新增的 ILS 模块手册录入**：

- 数据源：官方模块手册 PDF（SoSe 2026），70 页
- 提取全部 32 个模块，含 ECTS、所属模块组、考试形式、开课频率、语言
- 处理了英德双语混排模板（`1 Module name` vs `1 Modulbezeichnung`）
- 处理了德文字段换行、变音符号编码损坏、ECTS 与模块名跨行
- 去重重复条目 `48241`
- 模块组归属从 `9 Verwendbarkeit des Moduls` 字段推导

**规则面板渲染改造**（从平铺改为树）：

原来只渲染 `ruleText`，模块列表**完全不可见** —— 学生看到「两个模块组 30+35 ECTS」却不知道是哪些课。

现在按层级树渲染：

```
硕士总学分 · 32
  模块组 1 必修与选修模块 (10)   ← 核心必修课排最前
  模块组 2 必修与选修模块 (8)
  模块组 3 必修与选修模块 (11)
  统计、深化模块与硕士论文 (3)
```

- 子组已列出的模块不在父级重复（`covered` Set 去重）
- 每组右侧显示 ECTS
- 每张卡片底部有官方来源链接，可点进去核对原文
- 验证状态徽章（已验证 / 待核实）

### 2.5 学期规划（Semester Planner）

- 课程添加、编辑、调整、重修、删除
- 独立的 ECTS ／ 要求组引擎（纯函数，不依赖 React）
- 区分 planned / enrolled / passed / failed / recognized
- 处理失败、认定、重修、PO 不匹配、额外课程、互斥分组防重复计分
- 数据存 IndexedDB `planner-courses` / `planner-attempts`

**ECTS 引擎关键不变量**（有测试保护）：
- 20 planned + 5 passed ≠ earned 25
- 同一 6 ECTS 模块进入两个互斥池，总计仍为 6
- recognized 仅在用户确认有效时计入
- 规则不完整时结果标 unknown 并说明原因，不显示「预计满足毕业要求」

### 2.6 考试与任务（Exams & Tasks）

- 个人考试、手动报名状态、课程关联、地点、备注
- 学习任务管理
- `Europe/Berlin` 墙钟时间校验，包括夏令时不存在时刻与重复时段
- 时间线视图
- 完全本地生成的 ICS 日历导出
- 数据存 IndexedDB `personal-exams` / `study-tasks`

### 2.7 数据治理

- 版本化 JSON 备份导出
- 结构与大小校验
- 冲突保护
- IndexedDB 单事务合并恢复
- 设置页二次确认后的本地数据彻底清空

### 2.8 安全

- 严格 CSP（`default-src 'self'`，禁止 `object-src`，`base-uri 'self'`）
- 全本地静态资源，无 CDN、无远程字体、无远程脚本
- 禁止后台远程请求（有静态扫描测试保护）
- 错误边界
- 外链只允许 `https:`，明确提示将离开应用

### 2.9 部署

- 平台：Cloudflare Pages（Git 集成，push 自动构建）
- 生产分支：`main`
- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：22
- SPA 回退：`public/_routes.json` + `dist/404.html`

---

## 三、质量门禁（当前全绿）

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npm run typecheck` | ✅ 0 错误 |
| 代码规范 | `npm run lint` | ✅ 0 错误 |
| 静态测试 | `npm run test:static` | ✅ 36/36 |
| 单元测试 | `npm test` | ✅ 142/142（含新增的 6 条生物专业回归测试） |
| E2E | `npm run test:e2e` | ✅ 7 通过 / 2 跳过 |
| 数据校验 | `npm run test:data` | ✅ ALL CHECKS PASSED |
| 构建 | `npm run build` | ✅ 成功（已拆分 vendor chunk，无体积告警） |

**数据校验包含的额外检查**：

1. 选修清单不得重复列同一模块
2. 模块组子组必须挂在正确父组下
3. 每组核心模块 ECTS 必须等于条例规定值（15 / 15 / 10）
4. PO 有效范围与交叉引用完整性

---

## 四、部署与使用指导

### 4.1 日常使用（零命令）

直接打开：**https://fau-studyinfo-navigator.pages.dev**

- 24 小时在线，与你的电脑是否开机无关
- 手机、平板、任何设备都能访问
- 建议收藏，或手机上「添加到主屏幕」

**操作路径**：

1. 首页是专业选择器
2. 学位类型 → 硕士
3. 学院 → 自然科学学院
4. 专业 → 选具体专业（目前 3 个）
5. 入学学期 → 按实际选择
6. 勾选遇到的情况 → 保存专业
7. 下滑到「规则详情」查看模块清单

**数据存储位置**：

| 数据 | 位置 |
|---|---|
| 语言、主题 | `localStorage: fau-study-navigator.preferences.v1` |
| 资源范围、排序、收藏、自定义分类 | `localStorage: fau-study-navigator.resources.v1` |
| 专业范围与已确认 PO | IndexedDB `academic-profile` |
| 课程与重修记录 | IndexedDB `planner-courses` / `planner-attempts` |
| 个人考试与学习任务 | IndexedDB `personal-exams` / `study-tasks` |

⚠️ 所有个人数据只存在当前浏览器。换设备看不到，清浏览器数据会丢。需要迁移用设置页的备份导出。

### 4.2 修改代码后发布

```bash
cd D:\dev\FAU-Study-Navigator
git add -A
git commit -m "说明改了什么"
git push
```

push 后 Cloudflare 自动构建，约 2 分钟生效。

### 4.3 本地开发

```bash
cd D:\dev\FAU-Study-Navigator
npm run dev          # 开发服务器 http://127.0.0.1:5173
npm run build        # 生产构建到 dist/
npm run preview      # 本地预览生产构建
```

⚠️ 只用 `127.0.0.1`，不要和 `localhost` 混用 —— 浏览器视为不同站点，会看到不同数据。

---

## 五、未实现内容

### 5.1 学术数据覆盖：只做生物系三个硕士专业（有意为之）

数据包里只有 **3 个专业**，全部属于自然科学学院生物系。这不是遗漏，而是当前版本明确的范围：每一条学业规则都要对照官方考试条例逐条转录、人工核实，没有快捷方式。

**其他四个学院完全空白**：

- 人文、社会科学与神学学院
- 经济、管理与法律学院
- 医学院
- 工程学院

**生物系之外的专业也没有录入。** 以下是维护者早前手工整理的候选清单，**未经逐条核实**：数据包里没有登记「自然科学学院一共有多少个硕士专业」，因此这个数字无法从代码验证（见 `docs/SCALABILITY_AUDIT.md` 第 2 节）。原表写「12 个」但实际列了 13 行，这里按实际条目列出，不猜数字：

| 候选专业 | 所属系 |
|---|---|
| Chemistry (M.Sc.) | 化学与药学 |
| Molecular Science (M.Sc.) | 化学与药学 |
| Computational Molecular and Materials Science (M.Sc.) | 化学与药学 |
| Computational and Applied Mathematics (M.Sc.) | 数学 |
| Mathematik (M.Sc.) | 数学 |
| Wirtschaftsmathematik (M.Sc.) | 数学 |
| Physics (M.Sc.) | 物理 |
| Data Science (M.Sc.) | 数据科学 |
| Earth System Dynamics and Evolution (M.Sc.) | 地理与地球科学 |
| Geowissenschaften (M.Sc.) | 地理与地球科学 |
| GeoThermie/GeoEnergie (M.Sc.) | 地理与地球科学 |
| Physical Geography: Climate and Environmental Sciences (M.Sc.) | 地理与地球科学 |
| Geographie: Kulturgeographie (M.A.) | 地理与地球科学 |

**2026-10-24 起，这个问题改由界面和贡献流程处理，而不是假装不存在**：

- 首页新增「当前数据覆盖范围」区块，逐学院显示「已录入 / 待补充」；
- 选中没有数据的学院时，专业页显示「该学院尚未录入培养计划与 PO」，附贡献指南和「申请录入我的学院」两个入口；
- 覆盖率由 `src/data/coverage.ts` 从数据推导，录入数据后自动变化；
- 外部贡献者按 `docs/ADDING_A_FACULTY.md` 补数据即可，不需要改 React 组件。

用户影响：非生物系学生点进去会看到明确的空白说明和贡献入口，而不是一个看起来没做完的页面。

### 5.1.1 已录入但不完整的 PO 版本

**2026-10-24 更新：ZMB 2019 已补齐。** 官方 2019-10-28 版 Anlage 2 与 2026 版逐行一致（13 个模块、120 ECTS、同一分组），已按第 11 页转录 13 个模块版本与 5 个要求组，`po-zmb-2019` 现在可以被 2026 夏季及之前入学的学生正常使用。

仍不完整的版本：

| PO | 状态 | 说明 |
|---|---|---|
| `po-iimmune-2022` | `needs_review`，无要求组 | 2026 夏季及之前入学的 iImmune 学生适用。只登记版本，未取得并转录其条例原文；选中后显示「此版本尚未逐条录入」。 |
| `po-zmb-2019` | `verified` | 已补齐（见上）。 |

### 5.2 HTTP 状态码问题（2026-10-23 已修复）

~~`/degree`、`/planner`、`/exams` 等子路径渲染正常，但返回 HTTP 404。~~

**已解决。** 根因不是 `_routes.json`，也不是 `_redirects` 写法，而是 `scripts/postbuild.mjs` 把 `index.html` 复制成了 `dist/404.html`。Cloudflare Pages 会把根目录的 `404.html` 当作权威的 not-found 响应体，用 404 状态码返回，从而覆盖 `wrangler.jsonc` 里的 `not_found_handling: "single-page-application"`。

修复（`d03ff0f`）：

- 停止生成 `dist/404.html`；
- 删除 `public/_redirects`（wrangler 会把它判为无限循环并忽略）；
- 线上实测 `/degree`、`/planner`、`/exams`、`/resources`、`/settings`、任意未知路径全部返回 **200**。

完整复现与验证记录见 `docs/SCALABILITY_AUDIT.md` 第 7 节。

### 5.3 其他未实现

- 多设备数据同步（需要后端，与「本地优先」原则冲突，需重新决策）
- 真实考试报名对接 Campo（官方明确不做，见免责声明）
- 官方日期自动更新（当前为静态打包数据）

---

## 六、期望内容与所需工序

### 6.1 补齐自然科学学院其他硕士专业

**2026-10-24 更新：策略已改，不再「先铺骨架」。**

原来的建议是「先让 12 个专业都能被选到，再逐个深度录入」。审计后的结论是反过来的：一个没有模块表、没有 PO 来源的空壳专业，会让数据看起来比实际更完整，学生点进去仍然什么都得不到，而维护者会误以为覆盖已经扩大。

现在的做法：

1. **一个专业做透**——来源、PO 有效区间、模块表、要求组、ECTS 核对、逐条断言，全部到位才标 `verified`；
2. 没做的学院在界面上**明确显示为空**，并给出贡献入口，而不是放一个点不到东西的空壳；
3. 外部贡献者按 `docs/ADDING_A_FACULTY.md` 接手自己学院，一次一个专业即可。

如果确实要先登记一个专业的基本信息，最小合法集合是：

1. `academicSources` 里登记官方考试条例（HTTPS、版本日期、`needs_review`）；
2. `programmes` 里加专业：`id`、`facultyId`、`degreeType`、中英文名称、`websiteSourceIds`、`dataStatus: "partial"`；
3. `examinationRegulationVersions` 里加 PO：`code`、`title`、`entrySemesterFrom` / `entrySemesterUntil`、`applicabilityNotes`、`sourceIds`、`verificationStatus: "needs_review"`；
4. 跑 `npm run test:data` 与 `npm run test`。

注意：PO 没有 `ectsTotal` 字段。总学分写在根要求组的 `minEcts` / `maxEcts` 里，不要往 PO 上塞不存在的属性。

#### 阶段 B：深度录入（每个专业约 4-8 小时）

以 ILS 为模板：

1. 提取 PDF 文本（`pdf-parse`）
2. 解析模块条目（处理英德混排、字段换行、编码问题）
3. 提取每个模块的：编号、名称、ECTS、所属组、考试形式、开课频率、语言
4. 建立 `RequirementGroup` 层级（父组 → 模块组 → 选修清单）
5. 核对每组核心 ECTS 与条例一致
6. 补齐 `dataReleaseId`
7. 跑全部质量门禁
8. 人工抽查 3-5 个模块对照原文

**难点预判**：
- 数学/物理系的模块手册格式可能和生物系完全不同
- 部分专业可能是纯德语手册
- 联合学位（如 Computational Molecular and Materials Science）可能跨学院

### 6.2 修复 HTTP 状态码（已完成）

2026-10-23 已修复，根因是 `dist/404.html` 覆盖了 SPA 回退，与 Transform Rules / Functions 无关。以下三种方案已作废，仅保留为历史记录：

- ~~方案 A：Cloudflare 后台 Transform Rules~~ 不需要
- ~~方案 B：Cloudflare Functions 中间件~~ 不需要
- ~~方案 C：接受现状~~ 已彻底解决

现状：所有子路径线上返回 200，见 5.2 节。

### 6.3 扩展其他学院（现在改为贡献驱动）

四个学院全部空白。**2026-10-24 起，这项工作不再只由维护者承担**：

1. 贡献者按 `docs/ADDING_A_FACULTY.md` 的操作顺序录入一个专业；
2. `src/data/coverage.ts` 从数据推导学院状态，录入后首页和专页自动从「待补充」变成「已录入」；
3. `coverage.test.ts` 钉住当前覆盖数字，数据变了测试会提示同步；
4. 审核重点只有两件事：来源是否可追溯、有没有猜测的数值。

**建议接手顺序**（按学生需求量和数据可得性）：
1. 工程学院（专业多，学生基数大）
2. 医学院（人最多，但考试条例可能不公开）
3. 经济、管理与法律学院
4. 人文、社会科学与神学学院

### 6.4 数据维护机制

学术条例会更新（FAU 每年调整）。需要：

1. 建立来源版本追踪表
2. 定期检查官方页面有无新版条例
3. 条例更新时同步更新 `ModuleVersion`，保留旧版本供历史学生使用
4. `dataReleaseId` 递增规范

**工序建议**：每学期开学前检查一次（2 月和 9 月）。

---

## 七、项目文件结构

```
D:\dev\FAU-Study-Navigator\
├── .github\
│   ├── ISSUE_TEMPLATE\                  bug / 数据纠错 / 学院缺失 三个表单
│   ├── pull_request_template.md
│   └── workflows\
│       ├── ci.yml                       typecheck + lint + 数据 + 测试 + 构建 + E2E
│       └── deploy-pages.yml             GitHub Pages 镜像（备用站点）
├── docs\                                12 份项目文档
│   ├── ACADEMIC_DATA_MODEL.md
│   ├── ADDING_A_FACULTY.md              给其他学院贡献者的完整手册
│   ├── ARCHITECTURE.md
│   ├── DATA_POLICY.md
│   ├── DEVELOPMENT_PLAN.md              P0-P6 计划
│   ├── ECTS_ENGINE.md
│   ├── EXAMS_TASKS.md
│   ├── LOCAL_VERIFICATION.md
│   ├── P6_ACCEPTANCE_REPORT.md
│   ├── PROJECT_LOG.md                   本文件
│   ├── SCALABILITY_AUDIT.md             源码级审计
│   └── TEST_PLAN.md
├── public\
│   ├── _routes.json                     Pages 路由声明
│   ├── icon.svg                         站点图标（manifest / favicon）
│   └── manifest.json                    Web App Manifest（合法 JSON）
├── scripts\
│   ├── manual-verify.mjs
│   ├── postbuild.mjs                    只写 .nojekyll，不生成 404.html
│   └── validate-academic.mjs            数据校验（引用、PO 范围、ECTS 算术）
├── src\
│   ├── app\                             路由与 App 入口
│   ├── components\                      通用组件与布局
│   ├── data\
│   │   ├── academic\academic-data.json  56 模块 / 15 要求组 / 17 来源 / 4 PO
│   │   ├── academicData.ts
│   │   ├── coverage.ts                  覆盖率推导（哪些学院已录入）
│   │   ├── faculties.ts
│   │   ├── officialAcademicDates.ts
│   │   ├── resourceCategories.ts
│   │   └── resources.ts                 30 条资源 / 7 个分类
│   ├── domain\                          纯函数领域逻辑
│   │   ├── academic.ts                  PO 模型
│   │   ├── academicMatching.ts          规则匹配
│   │   ├── berlinDateTime.ts            时区
│   │   ├── calendarExport.ts            ICS 生成
│   │   ├── courseCatalogue.ts           课程目录
│   │   ├── ectsEngine.ts                ECTS 引擎
│   │   ├── exams.ts
│   │   ├── planner.ts
│   │   ├── resources.ts
│   │   ├── timetableGrid.ts             周网格布局
│   │   └── timetableLabels.ts
│   ├── features\                        六个功能页面（含 TimetableGrid 等）
│   ├── i18n\                            中英文消息
│   ├── storage\                         IndexedDB / localStorage
│   └── store\                           Zustand 状态
├── sources\ils\                         ILS 模块手册 PDF（核对用，版权归 FAU）
├── tests\static.test.mjs                32 项静态检查
├── upload\PRD(1).md                     最初的需求文档（保留原样）
├── AGENTS.md                            本地开发与开源协作约束
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                              MIT
├── SECURITY.md
├── package.json
├── vite.config.ts                       含 GITHUB_PAGES 条件 base 与 vendor 拆分
└── wrangler.jsonc                       Cloudflare 配置
```

---

## 八、关键决策记录

| 日期 | 决策 | 理由 |
|---|---|---|
| 2026-10-22 | 规则面板从平铺改为树形渲染 | 29 个模块平铺让学生看不出分组 |
| 2026-10-22 | 模块组核心必修课从父组移回各自组 | 原布局让必修课看起来像选修 |
| 2026-10-22 | 组名从「选修课清单」改为「必修与选修模块」 | 语义准确 |
| 2026-10-22 | 部署从 GitHub Pages 改 Cloudflare Pages | 私有仓库 + 免费账号不支持 Pages |
| 2026-10-22 | 项目从 C 盘迁移到 D 盘 | 用户要求 |
| 2026-10-22 | 删除 G 盘两个备份快照 | 代码已在 GitHub，快照冗余 |
| 2026-10-22 | FAUmail 加入资源清单，优先级 45 | 邮箱随 IdM 激活后开通，两者实际连用 |
| 2026-10-22 | 首页新增「常用入口」三张卡 | 每天要用的服务不该先经过资源页 |
| 2026-10-22 | FAUmail 不进左侧主菜单 | 主菜单是站内功能，外部站点混入会误导 |

---

## 九、已知问题与教训

### 9.1 DOM 探针选错容器导致假 bug

调试「硕士总学分卡片显示 32 个模块」时，用 `heading.closest('section')` 选规则区，结果把整个外层容器（含官方来源面板）全选了，误以为渲染有 bug。

**实际数据层完全正确**，是探针错了。

**教训**：DOM 探针必须用 `data-testid` 或明确容器，不要用 `closest()` 往上找。

### 9.2 删目录失败是进程锁

删除 `C:\dev\FAU-Study-Navigator` 时失败，误以为是权限或长路径问题。实际是 3 个 vite dev server 进程从该目录运行，锁住了 3 个原生 `.node` 二进制。

**教训**：删目录前用 `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` 查 CommandLine，确认没有 dev server 从目标目录跑。注意别误杀 OpenClaw 自己的进程。

### 9.3 PowerShell 内联脚本易碎

多次用 `node -e "..."` 内联脚本因 PowerShell 引号转义失败。

**教训**：复杂脚本写成 `.cjs` / `.mjs` 文件执行，不要在命令行内联。

### 9.4 探测脚本漏填字段导致误判「功能坏了」

排查「细胞与分子生物学专业选不到任何 PO」时，先以为匹配逻辑有 bug。实际是页面有**两个**输入：年份数字框（`input[type=number]`，占位符「入学年份」）和夏/冬下拉。探测脚本只填了下拉、没填年份，`entrySemesterId` 拼出来是 `-winter`，正则不匹配，自然返回空。

补上 2025 后一切正常：2026 冬季 → `po-zmb-2026`；2024/2025 入学 → `po-zmb-2019`。

**教训**：报「功能坏了」之前，先确认探测脚本把所有必填项都填了。表现是「永远为空」而不是「部分错误」时，优先怀疑输入不完整。

### 9.5 FPO BAMA Bio 2019 是空壳，但提示文案误导（已修复）

数据结构上 `po-zmb-2019` **没有任何 requirementGroup**（`groups=0`）。这是**有意为之**：`applicabilityNotes` 写明「本工具未逐条录入该版模块表」，`verificationStatus` 为 `needs_review`。

**但它是个陷阱**：老生（2026 夏季及之前入学）会正确匹配到这个 PO，选中后规则面板显示「尚无已核实的专业规则」—— 这句话语义是错的。专业是核实过的，只是这一版没录模块表。学生会以为自己的选择没保存成功。

**修复**：`DegreePage.tsx` 空状态改为按 `activePo` 分支：
- 未选专业 → 原通用文案
- 已选 PO 但无组 → 新增 `degree.poTemplateOnlyTitle/Body`：「此 PO 版本尚未逐条录入……这不代表你的选择无效，也不代表这个版本不存在」

**教训**：空状态文案要区分「没有数据」和「这一项没录」。后者必须明说「你的选择有效」，否则会被当成 bug。

---

*本文档由项目维护者与 AI 助手共同整理，2026-10-22*

---

## 十、变更历史

### 2026-10-22 · 关机前检查：修复 2019 PO 空状态误导（未发布）

**发现问题**：`FPO BAMA Bio 2019` 无要求组，选中后规则面板显示「尚无已核实的专业规则」。这句话语义错误 —— 专业已核实，只是这一版没录模块表。学生会以为自己的选择没保存。

**改动**：

| 文件 | 改动 |
|---|---|
| `src/features/degree/DegreePage.tsx` | 空状态按 `activePo` 分支渲染 |
| `src/i18n/messages.ts` | 新增 `degree.poTemplateOnlyTitle` / `poTemplateOnlyBody` |

**验证**：typecheck 0 / lint 0 / 单元 32 / 静态 32 / 数据 ALL CHECKS PASSED / build 成功 / 浏览器实测新文案出现、旧文案消失。

**顺带核实的数据事实**（手工统计，与 2.3 节一致）：

| 项目 | 实际值 |
|---|---|
| modules | 65 |
| moduleVersions | 65 |
| requirementGroups | 15 |
| academicSources | 17 |
| programmes | 3 |
| faculties | 5 |
| examinationRegulationVersions | **4**（含 2019 空壳） |
| resourceSeeds | 13 |
| dataReleaseId | `2026-10-22.2` |

各专业模块数：ZMB 13、ILS 32、整合免疫学 11 —— 与日志一致。

---

### 2026-10-22 · `c7595a6` 加入 FAUmail

**改动文件**：

| 文件 | 改动 |
|---|---|
| `src/data/resources.ts` | 新增 `faumail` 资源条目，优先级 45，分类 `services` |
| `src/components/common/Icon.tsx` | 新增 `mail` 图标（信封） |
| `src/features/dashboard/DashboardPage.tsx` | 新增「常用入口」区块与 `quickLinks` 常量 |
| `src/i18n/messages.ts` | 新增 8 个键（中英各 8 条） |

**新增的 i18n 键**：

```
dashboard.quickLinksTitle
dashboard.quickLinksBody
dashboard.quickLinksMail / quickLinksMailBody
dashboard.quickLinksCampo / quickLinksCampoBody
dashboard.quickLinksStudOn / quickLinksStudOnBody
```

**验证结果**：

| 检查 | 结果 |
|---|---|
| typecheck | ✅ 0 错误 |
| lint | ✅ 0 错误 |
| 单元测试 | ✅ 32/32 |
| 静态测试 | ✅ 32/32 |
| 数据校验 | ✅ ALL CHECKS PASSED |
| 构建 | ✅ 成功 |
| 本地浏览器实测 | ✅ 三个入口渲染正常，无控制台报错 |
| 线上实测 | ✅ 已确认生效 |

**线上实测输出**（`fau-studyinfo-navigator.pages.dev`）：

```
quickLinks: true
  https://faumail.fau.de      target=_blank  rel=noopener noreferrer
  https://campo.fau.de        target=_blank  rel=noopener noreferrer
  https://www.studon.fau.de   target=_blank  rel=noopener noreferrer
errors: none
```

---

### 2026-10-22 · `0d94de7` 项目日志初版

创建 `docs/PROJECT_LOG.md`，记录功能、缺口与工序。

### 2026-10-22 · `971238d` Cloudflare Pages 子路由修复

新增 `public/_routes.json`。说明见「九、已知问题」中关于 404 状态码的部分。

### 2026-10-22 · `faf9e7d` GitHub Pages 工作流

`.github/workflows/deploy-pages.yml`。因私有仓库 + 免费账号不支持 Pages，改用 Cloudflare，此工作流当时未启用。**2026-10-24 重写并保留**：它其实一直在成功部署 `tommy2345-art.github.io/FAU-Studyinfo-Navigator/` 镜像，只是缺少测试步骤；重写后补上 `test:data`、`lint`、`typecheck`、`test`，并注明 GitHub Pages 必须靠 `404.html` 做 SPA 回退，而 Cloudflare 必须没有它。

### 2026-10-22 · `970bf85` ILS 模块手册录入

32 个模块入库，规则面板改为树形渲染。详见 2.4 节。

---

## 十一、下一步待办（按优先级）

| 优先级 | 事项 | 状态 | 说明 |
|---|---|---|---|
| ~~高~~ | ~~补 `iimmun-m8-v1` 的 ECTS~~ | ✅ 已完成（2026-10-24） | 2026 版 PO Appendix 2 把第三学期拆为 Practical 15 + Theoretical 10；已改为 15/10，并更名模块 |
| ~~中~~ | ~~补 2019 版 ZMB 条例的模块表~~ | ✅ 已完成（2026-10-24） | 2019 版 Anlage 2 与 2026 版逐行一致，已转录 13 个模块与 5 个要求组 |
| 中 | 补自然科学学院其他专业骨架 | 未开始 | 现在有贡献指南和覆盖率 UI，可由外部贡献者接手 |
| 中 | 为每条规则建立逐字段证据（RuleEvidence） | 未开始 | PDF 改版后目前无法 diff 出哪个数值变了 |
| 低 | 扩四个学院 | 未开始 | 按学院分批，接口已留好 |
| 低 | 条例版本追踪机制 | 部分 | ILS 手册已有 SHA-256 + 页码 + 35 条断言，可作模板 |
| 低 | 独立屏幕阅读器与 400% 缩放人工认证 | 未完成 | 弹窗已有语义与键盘支持 |

已完成的旧待办：子路径 404（见 5.2）、ILS 数据重复与轨道串组（见第十二节）、开源化（LICENSE、贡献指南、CI）。

详见第六节「期望内容与所需工序」。

---

## 十二、2026-10-23 / 10-24：功能推进与开源化

### 12.1 2026-10-23 · `d03ff0f` 子路径 404 根因修复

见 5.2 节。新增 `docs/SCALABILITY_AUDIT.md`（源码级审计），删除无用的 `public/_redirects` 与 GitHub Pages 部署方式。

### 12.2 2026-10-23 · `4f3acb1` ILS 数据修正 + 课程目录选择器 + 课程表初版

- 删除 9 个不属于任何要求组的重复 ILS 目录条目；
- `rg-ils-abschluss` 改为指向真实的统计／深化／论文模块；
- 三个模块组各自绑定自己的 track，修复「选 MG1+MG2 也把 MG3 模块算进去」；
- 模块组 ECTS 改为真实区间（每组 30–40，成对 60–65）；
- 课程录入从自由文本改为可搜索的目录选择器，携带模块代码、ECTS、开课学期与可计入要求组；
- 每学期新增课程表（星期 + 教室）。

### 12.3 2026-10-23 · `6482c44` ILS 32 个模块逐条核对

- 打开官方模块手册（SoSe 2026，70 页，SHA-256 `4a04ccdf…`），逐模块核对 ECTS，全部一致；
- 补齐 32 个模块原本全为 `null` 的 `offeringTerms`；
- `versionLabel` 标注每个模块出自手册第几页；
- 新增 `src/data/ilsHandbook.test.ts`：35 条断言把每个模块绑到手册页码，数据与 PDF 漂移会直接构建失败。

### 12.4 2026-10-23 至 10-24 · `6a07c70` `73b5212` `bef1df4` 课程表

- 08:00–21:00 五列周网格，按开始时间定位、按课时拉伸；
- 一门课可跨多个星期，每个星期独立开始/结束时间；
- 冲突检测：琥珀色描边 + 点名两门课；
- 旧数据迁移：第一版的 `day` 字符串、第二版的共享 `startMinutes` 都会在读取时折叠进 `meetings`，避免升级后整个计划读不出来；
- 表单改为本地草稿 + blur 提交，修复「输入 11:00-12:30 却存成 09:00-12:30」的写入回弹。

### 12.5 2026-10-24 · `70820dc` 国际学生专区

17 条资源，7 个分类新增 `international`；机会徽章（资助／项目／支持／职业）、受众、资助内容、申请窗口、文件链接；新增按截止日排序（按日期比较，不是按文本）。修了两个排序 bug：无日期条目被当作相等导致比较器提前返回；日期解析误把学期标签 `2027/28` 当日期。

### 12.6 2026-10-24 · 开源化整理（本次）

**细节修复**：

| 文件 | 问题 | 修复 |
|---|---|---|
| `public/manifest.json` | 文件开头误带 `/* ... */` JS 注释，整份 JSON 非法；`index.html` 也没引用它 | 改为合法 JSON，补 description、scope、icon，路径改相对以便 Pages 子路径镜像使用；在 `index.html` 中引用 |
| `index.html` | 无 favicon、无 manifest | 新增 `public/icon.svg`，补 `<link rel="icon">` 与 `<link rel="manifest">` |
| `public/_routes.json` | `exclude` 里挂着不存在的 `/favicon.ico` | 换成 `/icon.svg` |
| `src/features/degree/DegreePage.tsx` | 默认学位类型是 `bachelor`，而数据只有硕士，首次进入必然看到空列表 | 默认落在有数据的学位类型 |
| `src/features/degree/DegreePage.tsx` | 选了没有数据的学院，只有一个灰掉的选项，看不出是缺数据还是坏了 | 增加「该学院尚未录入」卡片 + 贡献指南 + 申请入口 |
| `src/features/degree/DegreePage.tsx` | `ects: null` 只显示 `—`，像显示故障 | 增加「ECTS 待确认」徽章 |
| `src/i18n/messages.ts` | 「本地数据包尚无已核实专业」「生产数据包有意保持为空」等描述已过期 | 改为当前真实覆盖范围（中英同步） |
| `package.json` | `private: true`，无 license/repository/homepage/keywords，版本 0.1.0 | 改为公开包元数据，版本 0.2.0，MIT |
| `vite.config.ts` | 单一 620 kB bundle，触发体积告警 | 拆分 `react-vendor` / `schema-vendor`，最大 chunk 降到 313 kB，告警消失 |
| `.gitignore` | `shot-*.png` 重复、条目散乱 | 去重并归并注释 |
| `AGENTS.md` | 仓库名写成 `FAU-Study-Navigator`（实际 `FAU-Studyinfo-Navigator`），且仍写「禁止公开仓库」 | 更正仓库名，更新为公开 + MIT 的协作约定 |
| `docs/PROJECT_LOG.md` | 数据规模 65／测试 40／PO 数量等全部过期；「15 个硕士专业」「12 个待录入」与实际 13 行表格自相矛盾 | 全部按实测更新，并标注未核实来源 |
| `.github/workflows/deploy-pages.yml` | 审计时以为「未启用」，实际每次推送都在成功部署镜像；且缺少测试步骤 | 保留并重写：补 `test:data` / `lint` / `typecheck` / `test`，注释说明 GitHub Pages 需要 `404.html` 而 Cloudflare 绝对不能有；新增 `ci.yml` 负责 PR 校验 |
| `src/data/academic/academic-data.json` | **ILS 两个组门槛写错**：`rg-ils-abschluss` 规则文本写 5+20+30=55，门槛却是 60；`rg-ils-modulgruppen` 规则文本写 65，门槛却是 60。两者刚好凑成 120，所以校验没发现 | 按官方 § 51 Abs. 2 改为 65 + 55，并同步规则文本 |
| `src/data/academic/academic-data.json` | ILS PO 的 `entrySemesterFrom` 是 `null`，2023 冬季之前入学的学生会被错误地套用当前条例 | 按 § 54 改为 `2023-winter`，并在 `applicabilityNotes` 写明旧版尚未录入 |
| `src/domain/ectsEngine.ts` | **父组永远 0 学分**：引擎逐组独立结算，而 120 学分总组本身没有模块，只有子组。结果所有专业结构上都不可能「满足毕业」 | 子组学分向上汇总到父组；状态与缺分按汇总值计算，循环依赖有防护 |
| `scripts/validate-academic.mjs` | 只检查根组子项合计，不检查「组内模块能否凑够门槛」，所以 55<60 的错误躲过了 32 项检查 | 新增逐组可达性检查（needs N, offers M），上面两个门槛错误现在会被直接抓住 |
| `src/i18n/messages.ts` | `degree.noProgrammes` 等描述与实际不符 | 同步更新 |

**新增行为测试**（之前核心 ECTS 引擎只有源码正则检查，没有行为测试）：

| 文件 | 覆盖 |
|---|---|
| `src/domain/ectsEngine.test.ts` | 7 条：子组学分汇总到父组、缺一组则整体不满足、计划学分不计入已得、`ects: null` 不按 0 计、跨 PO 课程被排除、来源未核实则结论 unknown、无要求组则 unknown |
| `src/data/fullPlan.test.ts` | 2 条真数据集成：按 ILS § 51 Abs. 2 拼出 35+30+55 的完整计划，断言 `graduationStatus = satisfied`；少 5 学分时断言缺口被准确报告 |

**数据版本**：`dataReleaseId` 从 `2026-10-22.2` 升至 `2026-10-24.1`。此前模块从 65 减到 56、ILS 数据全部重核，但发布号没递增。

### 12.7 开源化：新增文件

| 文件 | 作用 |
|---|---|
| `LICENSE` | 标准 MIT 全文（保持纯净，GitHub 才能识别为 MIT） |
| `NOTICE.md` | FAU 官方文件版权、与 FAU 无隶属关系、无个人数据三项声明；MIT 不覆盖官方文件 |
| `CONTRIBUTING.md` | 中英双语：开发、门禁、数据红线、提交信息风格、PR 检查表 |
| `docs/ADDING_A_FACULTY.md` | 给其他学院贡献者的完整手册：找条例、登记来源、加专业/PO/模块/要求组、跑校验、常见坑 |
| `CODE_OF_CONDUCT.md` | 行为准则（含「不猜测数据」与「不要上传 FAU 凭据」） |
| `SECURITY.md` | 漏洞范围（XSS、CSP、备份导入、静默请求）与报告方式 |
| `.github/ISSUE_TEMPLATE/*` | bug、学术数据纠错、学院缺失三个表单 + 联系链接 |
| `.github/pull_request_template.md` | PR 检查表，含数据变更必填项 |
| `.github/workflows/ci.yml` | 每次 push/PR 跑 typecheck、lint、数据校验、单元测试、构建；单独 job 跑 E2E |

**覆盖率模块**（`src/data/coverage.ts`）：从数据包推导每个学院的状态，界面不需要改。`coverage.test.ts` 的 8 条断言分两类：结构不变量（每个学院一条、状态与数据一致、汇总与数据一致），以及「当前焦点」回归（三个生物专业及其 13/32/11 个模块）。它**不**断言「只有 nat 已覆盖」，见第十四节。

### 12.8 本轮验证结果

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | ✅ 0 错误 |
| `npm run lint` | ✅ 0 错误 |
| `npm run test:static` | ✅ 34/34（含隐私/法律声明检查） |
| `npm test`（含单元） | ✅ 136/136，21 个文件 |
| `npm run test:data` | ✅ ALL CHECKS PASSED |
| `npm run build` | ✅ 成功，无体积告警 |
| `npm run test:e2e` | ✅ 7 通过 / 2 跳过 |
| 线上子路径 | ✅ 全部 200 |

**未做**：没有伪造任何学术数据；当轮未补齐的 `iimmun-m8-v1` 与 ZMB 2019 已在第十六节按官方 PDF 补齐。

---

## 十三、2026-10-24 · 法律声明（Datenschutz / Urheberrecht）

项目面向德国高校，需要一个公开、可核对的非商业与数据保护声明：既在网站里直接可见，也在仓库里可追溯。这次把它当成功能来做，而不是贴一段免责声明。

### 13.1 网站

| 位置 | 内容 |
|---|---|
| `/legal` 路由 | 完整的法律声明页；不放进左侧主菜单（主菜单是站内功能，法律页属于常驻信息），从页脚、设置页和首页进入 |
| 页脚（每页常驻） | 「非商业学生工具 · 无追踪 · 数据只存本机」+ 法律声明链接 |
| 首页「本地优先」卡片 | 增加法律声明链接 |
| 设置页 | 新增「法律与数据保护」卡片，一段摘要 + 链接 |

页面结构：一句话概括 → 非商业 → 不抓取/不登录 → 数据保护（4 条要点）→ 版权与数据权益 → 独立性与责任限制 → 适用法律 → **Deutsche Zusammenfassung（7 段静态德语）** → 完整文件链接 → 联系方式。

德语摘要刻意不跟随界面语言切换：德语使用者和监管机构应当无需切换界面就能读到核心表述。

### 13.2 仓库文件

| 文件 | 内容 |
|---|---|
| `LEGAL.md` | 德语主文本 + 英文摘要 + 中文摘要。覆盖 § 5 DDG（私人非商业站点通常无需 Impressum）、DSGVO/BDSG（Art. 4, 6, 15–21, 25）、§ 25 TDDDG、§ 5 UrhG、§§ 87a ff. UrhG、责任限制、适用法律 |
| `NOTICE.md` | 增加指向 `LEGAL.md` 的说明 |
| `README.md` | 新增「法律声明与数据保护」章节，列出 6 条可核对的事实与对应保障 |
| `CONTRIBUTING.md` | 新增非商业与隐私底线：拒绝广告/联盟链接/募捐、拒绝 Cookie 与分析工具、不得转载整本受保护手册 |
| `AGENTS.md` | 新增第 9 节：改变存储、托管商、第三方请求或商业模式时，必须同步更新 `LEGAL.md`、`/legal` 文案与测试 |

### 13.3 自动化护栏

- `tests/static.test.mjs` 新增 2 项：
  1. 源码不得出现 `document.cookie`、`navigator.sendBeacon`、`gtag`/`dataLayer`/`plausible`/`matomo`/`google-analytics`；
  2. `LEGAL.md` 必须包含 DSGVO、BDSG、TDDDG、UrhG、nicht-kommerziell、Kein Scraping，且 `/legal` 路由与页脚链接存在。
- E2E 路由列表加入 `/legal`，确认中文与英文都能渲染且无远程请求。

### 13.4 声明里的诚实边界

- 明确写了「不是法律意见」，没有声称「完全合规」。
- 没有说「零数据处理」：托管商的访问日志（IP、User-Agent）如实写出，并给出 Art. 6(1)(f) 依据。
- 对 Impressum 只写「纯私人非商业站点通常不需要」，没有替用户做法律结论。
- 学院数据仍是手工转录，`sources/` 下官方文件的版权归属单列，权利人要求时移除。

### 13.5 验证结果

| 检查 | 结果 |
|---|---|
| typecheck / lint | ✅ 0 错误 |
| 静态测试 | ✅ 34/34（新增 2 项合规检查） |
| 单元测试 | ✅ 136/136 |
| E2E | ✅ 7 通过 / 2 跳过（含 `/legal`） |
| 构建 | ✅ 成功 |
| 浏览器实测 | ✅ `/legal` 9 个区块、7 段德语、3 个文件链接；页脚与设置入口存在；中英切换正常；无控制台错误 |

---

## 十四、2026-10-24 · 让「别人补自己学院」真的可行

### 14.1 问题

`coverage.test.ts` 原来断言三件事：只有 `nat` 已覆盖、其余四学院必须为空、总模块数必须是 56。这三条在 2026-10-24 是对的，但它们的语义是「**不许别人加数据**」：第一个来自工程学院的贡献者跑测试会看到三处红色，只能去改测试才能通过——而改测试正是贡献评审最该警惕的行为。

贡献指南写着「加数据就行，不用改代码」，测试却在说反话。这是文档与实现的矛盾，不是小瑕疵。

### 14.2 改法

把 8 条断言分成两类：

| 类型 | 断言 | 加新学院时 |
|---|---|---|
| 结构不变量 | 每个学院恰好报告一次；学院状态由自身专业推导；汇总数等于底层数据；有模块的组必须有可分摊的 PO | 始终通过 |
| 当前焦点回归 | 三个生物硕士专业仍在；13/32/11 个模块不变 | 始终通过（`arrayContaining` 与逐项断言，不是全等） |

删掉了「其余四学院为空」和「总数 56」这两条——它们属于某一时刻的快照，不属于契约。

### 14.3 演练

给 `tech` 临时加了一个只有 PO、没有要求组的骨架专业，`coverage.test.ts` 8/8 通过，`facultyCoverage` 正常把 `tech` 报为「有 1 个专业、0 个模块、状态待补充」。随后用 `git checkout` 还原，数据包未留改动。

### 14.4 文档补充

`docs/ADDING_A_FACULTY.md` 新增：

- 顶部 **Quick start** 十步表（含工时预期与「一次只做一个专业」）；
- **Do I upload the PDF?** 一节：PO 可存可不存，模块手册不要整本入库，登记 URL + 版本 + SHA-256；
- **From the Studienverlaufsplan to requirement groups**：把培养计划表格逐行映射到 `kind` / `minEcts` / 模块清单，并说明「总学分是根组、自身不带模块」与「三选二不是求和」；
- 明确「不需要改 `coverage.test.ts`；它若失败说明数据坏了，不要去改测试」。

### 14.5 验证

| 检查 | 结果 |
|---|---|
| typecheck / lint | ✅ 0 错误 |
| 数据校验 | ✅ ALL CHECKS PASSED |
| 静态测试 | ✅ 34/34 |
| 单元测试 | ✅ 136/136（含改写后的 8 条覆盖率断言） |
| 骨架专业演练 | ✅ 覆盖率测试保持 8/8，`tech` 正确显示为「待补充」 |

---

## 十五、2026-10-24 · 贡献者文档重构（中文教程 + 文档索引）

### 15.1 问题

原来的贡献路径对中文读者不友好：

- `docs/ADDING_A_FACULTY.md` 是英文长文，最可能来贡献的 FAU 中文学生要边翻译边做；
- README 的「贡献」只有三条链接，没有「我该先做什么」；
- 十三份 docs 没有索引，新人不清楚哪份是现状、哪份是历史。

### 15.2 新增中文教程

`docs/ADDING_A_FACULTY.zh-CN.md`，按「照着做」组织，而不是按数据模型组织：

| 部分 | 作用 |
|---|---|
| 30 秒看懂 + Mermaid 流程图 | 看清九步顺序与依赖 |
| 三种粒度（骨架 / 单专业 / 一个系） | 让人按可投入的时间选范围 |
| 第 0–8 步 | 每步一段可直接改的 JSON，字段含义写在表里 |
| 培养计划 → 规则组映射表 | 把 Studienverlaufsplan 的一行对到一个组 |
| 三选二的正确结构 | 父组 + 三个子组 + track 绑定，附 ILS 的真实反例 |
| 报错对照表 | `npm run test:data` 的八种典型报错 → 原因 → 修法 |
| 常见问题 | 只有条例能不能加、旧 PO 要不要删、课程名怎么翻等 |
| 字段速查 | 六个数组的必填字段与状态取值 |

### 15.3 其他文档改动

| 文件 | 改动 |
|---|---|
| `docs/README.md` | 新增文档索引，按「用 / 贡献 / 改代码 / 看状态 / 历史」分类，并标注哪些已过期 |
| `README.md` | 「贡献」改为「参与贡献」：三步开始、五学院缺口表、三种贡献方式、指向中文教程 |
| `CONTRIBUTING.md` | 顶部加中英文指南与文档索引链接 |
| `docs/ADDING_A_FACULTY.md` | 顶部加中文版链接；补一张 Mermaid 流程图 |
| `tests/static.test.mjs` | 新增第 35 项：中英文指南必须互相链接，README / CONTRIBUTING / docs 索引必须指向中文教程，中文教程必须保留「30 秒看懂 / 报错对照表 / 字段速查 / 常见问题」四节 |

### 15.4 验证

| 检查 | 结果 |
|---|---|
| typecheck / lint | ✅ 0 错误 |
| 静态测试 | ✅ 35/35 |
| 单元测试 | ✅ 136/136 |
| 构建 | ✅ 成功 |
| 链接检查 | ✅ 中英指南、README、CONTRIBUTING、docs 索引互相可达 |

---

## 十六、2026-10-24 · 按官方 PDF 复核三个生物硕士专业

### 16.1 输入

五份官方文件（用户提供，均来自 FAU 官方渠道）：

| 文件 | 页数 | 用途 |
|---|---|---|
| `FPO_BAMA_Bio_20260331.pdf` | 15 | ZMB 2026 版 PO，Anlage 2 第 13–14 页 |
| `Zell-und-Molekularbiologie-SoSe-26.pdf` | 95 | ZMB 模块手册（PO 2019 体系） |
| `FPO_BSc-MSc_ILS_FPO_BAMA_ILS_20230822_idF_20260331_en.pdf` | 19 | ILS 英文合并版 PO，Anlage 2a/2b |
| `FPOiImmune_20260213_en.pdf` | 27 | iImmune 2026 版 PO，Appendix 2 第 26–27 页 |
| `MHB_..._PO-Version-20222.pdf` | 21 | iImmune 模块手册（PO 2022 体系） |

另外从项目已登记的官方 URL 下载了 `FPO_BAMA_Bio_20191028.pdf`（13 页），用于补齐 2019 版。

### 16.2 核对结论与动作

| 专业 | 文件与数据的差异 | 动作 |
|---|---|---|
| ZMB 2026 | Anlage 2 的 13 个模块、ECTS 与分组与现有数据完全一致（6×7.5 + 20 + 15 + 5 + 5 + 30 = 120） | 无需改数据 |
| ZMB 2019 | **Anlage 2 与 2026 版逐行一致**；此前该 PO 是没有任何要求组的空壳 | 按 2019 版第 11 页新增 13 个模块版本（`-v2019`）+ 5 个要求组；`po-zmb-2019` 改为 `verified` |
| ILS 2026 | §51 Abs. 2 为 5 + 30 + 35 + 20 + 30 = 120，与现有 65 + 55 分组一致；§54 修订自 2026-04-01 生效，原则上适用于 2026/27 冬季起入学，§52 修订也适用于 2023 版学生 | 更新 `applicabilityNotes`，保留 `entrySemesterFrom: 2023-winter` |
| iImmune 2026 | **Appendix 2 把第三学期拆为 Practical 15 + Theoretical 10**，而数据是 Practical 25 + 一个 `ects: null` 的 Seminar；PO 的 `entrySemesterFrom` 还是 `null` | M7 改为 15，M8 改为 10 并更名为 Theoretical Project Work；PO 起始学期改为 `2026-winter`；补 `applicabilityNotes`（§32） |
| iImmune 2022 | 2026 夏季及之前入学的学生适用，但未取得该版条例原文 | 新增 `po-iimmune-2022` 壳（`needs_review`、无要求组、至 2026-summer），避免老生被错误套用 2026 规则 |

### 16.3 数据规模变化

| 项目 | 之前 | 现在 |
|---|---|---|
| 模块版本 | 56 | 69（+13 个 ZMB 2019 版本） |
| 要求组 | 15 | 20（+5 个 ZMB 2019 组） |
| PO 版本 | 4 | 5（+iImmune 2022 壳） |
| 数据版本 | `2026-10-24.1` | `2026-10-24.2` |

### 16.4 新增回归测试

`src/data/biologyProgrammes.test.ts`（6 条）：

- ZMB 2019 有 5 个组、13 个模块版本、根组 120；
- ZMB 2026 结构保持不变；
- iImmune M7=15、M8=10，Projekt 组合计 35；
- iImmune 2022 壳存在且不含模块；
- iImmune 2026 从 `2026-winter` 开始；
- 每个有规则的专业根组都是 120。

### 16.5 浏览器实测

| 场景 | 结果 |
|---|---|
| ZMB，2024 冬季入学 | 匹配 `po-zmb-2019`，显示 13 个模块，不再出现「尚未逐条录入」 |
| iImmune，2026 冬季入学 | 显示 11 个模块，含「项目工作理论模块」，无「ECTS 待确认」 |
| 控制台 | 无错误 |

### 16.6 仍未建模的部分

- **培养计划的学期分布**：Anlage 的 1–4 学期列尚未作为字段存储，界面按要求组与 ECTS 呈现。要逐模块显示学期，需要给 `moduleVersion` 增加 `recommendedSemester`（ILS 的 2a/2b 两种入学季还会让同一模块落在不同学期）。
- **考试形式**：PO 里的 Klausur/mündliche Prüfung 等未入库。
- **ZMB 2019 模块手册的专题内容**：95 页手册里各 Orientierungsmodul 的具体主题未逐条转录，数据沿用 PO 的四个模块行。
- **iImmune 2022 模块表**：只有壳，没有要求组。

---

## 十七、2026-10-24 · GitHub 展示与设计文档

### 17.1 问题

仓库能跑，但首页只有文字：没有界面预览，也没有一处说清「这项目是怎么设计的」。对开源项目来说，这会让第一次访问的人在 10 秒内离开，也让想接着做的人不知道从哪里下手。

### 17.2 README 重构

新增四个区块，放在最前面：

| 区块 | 内容 |
|---|---|
| 这是什么 | 给谁用、解决什么、不做什么、数据从哪来，四条 |
| 界面一览 | 四张 1440×950 真实截图，2×2 表格：首页、覆盖范围、规则树、国际学生资源 |
| 功能总览 | 七行表格：专业要求、学期规划、课程表、考试与任务、校园导航、数据治理、隐私与安全 |
| 项目怎么设计 | Mermaid 流程图（官方 PDF → JSON → Zod → 领域层 → 页面；用户数据 → IndexedDB）+ 链接到 `docs/DESIGN.md` |
| 路线图 | 三条当前最缺的事 + 链接到 `ROADMAP.md` |

截图全部来自真实构建，选择的是 ILS 2026 + MG1/MG2 方向，**不含任何个人数据**。

### 17.3 新增文档

| 文件 | 内容 |
|---|---|
| `docs/DESIGN.md` | 目标/非目标、总体架构图、数据模型 ER 图、9 条关键设计决策（决策/理由/代价）、数据流、安全设计、扩展方式、目录结构、已知取舍 |
| `ROADMAP.md` | 按 P0–P3 分级的公开路线图：缺哪个学院、每个方向从哪开始、难度标记、明确不做的事、如何认领 |
| `docs/README.md` | 索引加入 DESIGN、ROADMAP，按“用 / 贡献 / 改代码 / 看设计 / 看状态”分类 |

### 17.4 顺带修掉的细节

| 位置 | 问题 | 修复 |
|---|---|---|
| `resources.official` 文案 | 显示「PRD 已核对」/「Checked in PRD」，是早期需求文档阶段的遗留 | 改为「官方来源已核对」/「Official source checked」 |
| `src/data/resources.ts` | 资源来源标题写成「FAU 官方入口；项目 PRD §3.2：…」，把内部术语暴露给学生 | 改名 `officialSource`，标题改为「FAU 官方页面：…」 |

### 17.5 截图过程中的坑

第一次拍出来的“覆盖范围”截图和首页一模一样：全局 CSS 有 `scroll-behavior: smooth`，`scrollIntoView` 之后立刻截图，页面还在滚动动画中间。改成 `window.scrollTo({ behavior: 'instant' })` 后正常。

第二次拍“规则树”只显示了收尾组 3 个模块：探测脚本没有勾选 ILS 的方向（track），而方向组会被 `getRequirementGroupsForSelection` 过滤掉。补上 MG1/MG2 后正确显示 21 个模块。两条都记在这里，避免下次重拍再踩。

### 17.6 自动化护栏

`tests/static.test.mjs` 新增第 36 项：

- `docs/DESIGN.md` 必须存在且包含「总体架构」与 mermaid；
- `ROADMAP.md` 必须存在且包含 P0 与「不打算做」；
- README 必须引用四张截图，且文件真实存在。

### 17.7 验证

| 检查 | 结果 |
|---|---|
| typecheck / lint | ✅ 0 错误 |
| 静态测试 | ✅ 36/36 |
| 单元测试 | ✅ 142/142 |
| E2E | ✅ 7 通过 / 2 跳过 |
| 构建 | ✅ 成功 |
| 截图 | ✅ 4 张，均为真实构建、无个人数据 |
