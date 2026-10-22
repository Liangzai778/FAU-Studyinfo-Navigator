# FAU Study Navigator — 项目日志

> 日期：2026-10-22
> 项目路径：`D:\dev\FAU-Study-Navigator`（原 `C:\dev\FAU-Study-Navigator`，已迁移）
> 线上地址：https://fau-studyinfo-navigator.pages.dev
> 仓库：https://github.com/tommy2345-art/FAU-Studyinfo-Navigator（私有）
> 当前提交：`d502b91` — Refresh the project log after adding FAUmail
> 另有未提交改动：修复 2019 PO 空状态误导（见第十节）

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

**已收录的官方资源（13 条，按优先级排序）**：

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
- 数据版本通过 `dataReleaseId` 管理（当前 `2026-10-22.2`）

**当前数据规模**：

| 项目 | 数量 |
|---|---|
| 模块（Module） | 65 |
| 模块版本（ModuleVersion） | 65 |
| 要求组（RequirementGroup） | 15 |
| 官方来源（AcademicSource） | 17 |
| 专业（Programme） | 3 |
| 学院（Faculty） | 5 |

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
| 静态测试 | `npm run test:static` | ✅ 32/32 |
| 单元测试 | `npm test` | ✅ 40/40 |
| E2E | `npm run test:e2e` | ✅ 7 通过 / 2 跳过 |
| 数据校验 | `npm run test:data` | ✅ ALL CHECKS PASSED |
| 构建 | `npm run build` | ✅ 成功 |

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

### 5.1 学术数据覆盖不足（最大缺口）

自然科学学院共有 **15 个硕士专业**，目前只录入了 **3 个**（生物系）。

**待录入的 12 个**：

| 专业 | 所属系 |
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

**其他四个学院完全空白**：
- 人文、社会科学与神学学院
- 经济、管理与法律学院
- 医学院
- 工程学院

用户影响：非生物系学生点进去会看到空白，不报错但看起来像网站没做完。

### 5.1.1 已录入但不完整的 PO 版本

`FPO BAMA Bio 2019`（细胞与分子生物学旧版条例）在数据包里**存在**，但**没有任何要求组**：

| 字段 | 值 |
|---|---|
| `id` | `po-zmb-2019` |
| `entrySemesterFrom` | `null` |
| `entrySemesterUntil` | `2026-summer` |
| `verificationStatus` | `needs_review` |
| `applicabilityNotes` | 明确写「本工具未逐条录入该版模块表」 |

含义：**2026 夏季及之前入学的老生会正常匹配到这个 PO**，选中后看到的是「此 PO 版本尚未逐条录入」的提示，而不是模块清单。

这是已知且有意保留的缺口，不是 bug。要补齐需回溯 2019 版考试条例 PDF 并重新走一遍深度录入工序。

注意：`po-zmb-2019` 与 `po-zmb-2026` 同时挂在同一个专业下，入学期决定匹配哪个 —— 2026 冬季及之后 → 2026 版；之前 → 2019 版。两条路径均已实测正确。

### 5.2 HTTP 状态码问题

`/degree`、`/planner`、`/exams` 等子路径**渲染正常**，但返回 HTTP **404** 而不是 200。

- 用户实际无感：浏览器正常渲染 404 状态下的 HTML，点击、刷新、分享都能打开
- 影响：搜索引擎会视为「页面不存在」，部分聊天软件分享预览异常
- 原因：Cloudflare Pages 的 `_routes.json` 对纯静态站点不做任意路径回退，`_redirects` 规则未被消费
- 修法：Cloudflare 后台加 Bulk Redirects / Transform Rules，或调整 `_redirects` 写法

### 5.3 其他未实现

- 多设备数据同步（需要后端，与「本地优先」原则冲突，需重新决策）
- 真实考试报名对接 Campo（官方明确不做，见免责声明）
- 官方日期自动更新（当前为静态打包数据）

---

## 六、期望内容与所需工序

### 6.1 补齐自然科学学院 12 个硕士专业

**建议策略：先骨架后深度（2+1 组合）**

理由：学生点进去发现空白专业，比找不到专业更糟。

#### 阶段 A：骨架覆盖（约 1-2 天）

让 12 个专业都能被选到、都有基本信息，不转录模块。

每个专业需要：

1. 在 `src/data/academic/academic-data.json` 添加 `Programme` 条目
   - `id`、`facultyId: 'nat'`、`degreeType: 'master'`
   - `name` 中英文
   - `websiteSourceIds` 指向官方页面
2. 添加 `ExaminationRegulationVersion`（PO）
   - 版本号、有效学期范围
   - `ectsTotal`
3. 添加 `AcademicSource` 指向官方考试条例 PDF
   - 状态先标 `needs_review`
4. 跑 `npm run test:data` 验证引用完整性

**工序**：
- 从 nat.fau.de 各系页面找每个专业的考试条例（Prüfungsordnung）
- 下载 PDF，记录 URL 和版本日期
- 录入基本信息
- 数据校验必须通过

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

### 6.2 修复 HTTP 状态码（约 1-2 小时）

方案 A：Cloudflare 后台 Transform Rules
- 新建规则：路径匹配 `/degree*`、`/planner*`、`/exams*`、`/resources*`、`/settings*`
- 操作：Rewrite URL 为 `/index.html`，状态码保持 200

方案 B：改用 Cloudflare Functions
- 加 `functions/_middleware.ts`，做 SPA 回退

方案 C：接受现状
- 功能已正常，仅 SEO 和分享预览受影响

### 6.3 扩展其他学院（大工程，需分阶段）

四个学院全部空白。每个学院需要：

1. 摸清有多少专业（各学院官网）
2. 按学院分批做骨架
3. 再按系逐个深度录入

**建议顺序**（按学生需求量和数据可得性）：
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
├── .github\workflows\deploy-pages.yml   GitHub Pages 工作流（备用，当前未用）
├── docs\                                9 份项目文档
│   ├── ACADEMIC_DATA_MODEL.md
│   ├── ARCHITECTURE.md
│   ├── DATA_POLICY.md
│   ├── DEVELOPMENT_PLAN.md              P0-P6 计划
│   ├── ECTS_ENGINE.md
│   ├── EXAMS_TASKS.md
│   ├── LOCAL_VERIFICATION.md
│   ├── P6_ACCEPTANCE_REPORT.md
│   └── TEST_PLAN.md
├── public\
│   ├── _redirects                       SPA 回退（Cloudflare 未消费）
│   ├── _routes.json                     Pages 路由声明
│   └── manifest.json
├── scripts\
│   ├── manual-verify.mjs
│   ├── postbuild.mjs                    复制 404.html + .nojekyll
│   └── validate-academic.mjs            数据校验（32 项检查）
├── src\
│   ├── app\                             路由与 App 入口
│   ├── components\                      通用组件与布局
│   ├── data\
│   │   ├── academic\academic-data.json  65 模块 / 15 要求组 / 17 来源
│   │   ├── academicData.ts
│   │   ├── faculties.ts
│   │   ├── officialAcademicDates.ts
│   │   ├── resourceCategories.ts
│   │   └── resources.ts
│   ├── domain\                          纯函数领域逻辑
│   │   ├── academic.ts                  PO 模型
│   │   ├── academicMatching.ts          规则匹配
│   │   ├── berlinDateTime.ts            时区
│   │   ├── calendarExport.ts            ICS 生成
│   │   ├── ectsEngine.ts                ECTS 引擎
│   │   ├── exams.ts
│   │   ├── planner.ts
│   │   └── resources.ts
│   ├── features\                        六个功能页面
│   ├── i18n\                            中英文消息
│   ├── storage\                         IndexedDB / localStorage
│   └── store\                           Zustand 状态
├── tests\static.test.mjs                32 项静态检查
├── package.json
├── vite.config.ts                       含 GITHUB_PAGES 条件 base
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

`.github/workflows/deploy-pages.yml`。因私有仓库 + 免费账号不支持 Pages，改用 Cloudflare，此工作流保留但未启用。

### 2026-10-22 · `970bf85` ILS 模块手册录入

32 个模块入库，规则面板改为树形渲染。详见 2.4 节。

---

## 十一、下一步待办（按优先级）

| 优先级 | 事项 | 预估工时 |
|---|---|---|
| 高 | 补齐自然科学学院 12 个硕士专业骨架 | 1-2 天 |
| 中 | 修复子路径 HTTP 404 状态码 | 1-2 小时 |
| 中 | 深度录入 1-2 个用户关心的专业 | 每个 4-8 小时 |
| 低 | 扩展其他四个学院 | 按学院分批 |
| 低 | 建立条例版本追踪机制 | 每学期一次 |

详见第六节「期望内容与所需工序」。
