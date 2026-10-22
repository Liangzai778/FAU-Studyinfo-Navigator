# FAU Study Navigator

FAU Study Navigator 是面向 FAU 学生的本地优先学习导航与个人规划工具。项目独立开发，与 Friedrich-Alexander-Universität Erlangen-Nürnberg（FAU）没有官方隶属或认可关系。考试报名、课程注册、成绩、学分认定及具有法律效力的要求始终以 FAU 官方文件和 Campo 为准。

应用不会连接后端、云数据库、分析服务或在线 API。FAU 外链只会在用户主动点击后打开。

## 本地环境要求

- Node.js `>= 22.13.0`
- npm，以及包含 `package.json` 全部依赖的已批准本地 npm 缓存或离线镜像
- 支持 IndexedDB、localStorage、Blob 下载和现代 `Intl` 时区数据的浏览器
- 可选：本机已有 Playwright Chromium 浏览器，用于 E2E 测试

当前项目不允许自动访问 npm 注册表。不要为安装依赖连接 GitHub、Codex Cloud 或远程包源。

## 离线安装与启动

在项目根目录使用经过批准的离线缓存：

```bash
npm install --offline --cache /absolute/path/to/approved-npm-cache
npm run dev
```

开发服务器只监听 `127.0.0.1`，默认地址通常为 `http://127.0.0.1:5173`。

执行全部本地质量门禁：

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

不依赖第三方 npm 包的静态和核心领域测试：

```bash
npm run test:static
```

构建结果位于 `dist/`。只在本机预览生产构建：

```bash
npm run preview
```

## 已实现功能

- React、Vite、TypeScript strict、Tailwind CSS、React Router、Zod 和 Zustand 本地应用。
- Dashboard、Degree、Semester Planner、Exams、Resources、Settings 及 404 路由。
- 响应式顶部栏、桌面侧边栏、平板/手机底部导航和深浅主题。
- 默认简体中文，当前全部界面键提供英文版本；语言和主题刷新后保留。
- 五大学院及 Bachelor/Master 资源筛选、搜索、排序、收藏置顶。
- 用户个人网站与自定义分类的添加、编辑、删除和排序，所有外链要求 HTTPS。
- Faculty、Programme、ProgrammeTrack、PO、ModuleVersion、RequirementGroup、AcademicSource 等版本化 Zod 模型。
- 入学学期只筛选候选 PO；系统不会自动选中最新版，必须由用户确认。
- 独立于 React 的 ECTS 引擎：区分计划与获得学分，处理失败、认定、重修、PO 不匹配、额外课程和互斥分组防重复计分。
- 课程和学期计划的添加、编辑、调整、重修与删除。
- 个人考试、手动报名状态、课程关联、地点、备注和学习任务。
- `Europe/Berlin` 墙钟时间校验，包括夏令时不存在时刻与重复时段。
- 个人考试和任务时间线，以及完全本地生成的 ICS 日历。
- 版本化 JSON 备份、结构与大小校验、冲突保护及 IndexedDB 单事务合并恢复。
- 设置页提供二次确认后的本地数据彻底清空。
- CSP、本地静态资源、禁止后台远程请求扫描、错误边界与安全外链处理。
- Vitest/Testing Library 测试、无依赖静态测试及 Playwright 本地 E2E 配置。

## 数据保存位置

| 数据 | 浏览器位置 | 说明 |
|---|---|---|
| 语言、主题 | `localStorage: fau-study-navigator.preferences.v1` | 低敏界面偏好 |
| 资源范围、排序、收藏、个人网站、分类 | `localStorage: fau-study-navigator.resources.v1` | 仅当前浏览器 |
| 专业范围与已确认 PO | IndexedDB `fau-study-navigator / academic-profile` | 不根据入学年份自动改写 |
| 课程与重修记录 | IndexedDB `planner-courses`、`planner-attempts` | PO 变化不会覆盖历史记录 |
| 个人考试与学习任务 | IndexedDB `personal-exams`、`study-tasks` | 日期固定为 Europe/Berlin 语义 |
| 公共学院、来源与学术规则 | 随构建发布的本地 TypeScript/JSON | 只读且版本化 |

所有个人数据都停留在当前浏览器。清除浏览器站点数据、卸载浏览器或更换设备可能造成永久丢失。

## 数据备份与恢复

在“设置”页面选择“导出 JSON 备份”。文件在浏览器内存中生成并直接下载，不会上传。当前 schema v1 备份包含：

- 专业/PO 范围；
- 课程和重修记录；
- 个人考试和学习任务。

恢复时先进行 2 MiB 大小限制、JSON 安全键、嵌套深度、schemaVersion 和 Zod 结构校验，再要求用户确认。记录按稳定 ID 合并；相同 ID 内容冲突会拒绝整个恢复，不会静默覆盖现有数据。

语言、主题、收藏、个人网站和自定义分类目前不包含在 JSON 备份中。彻底清空会删除这些数据；执行前请自行记录仍需保留的设置和链接。

## 学术数据和真实性

生产学术数据包有意保持为空：当前没有录入任何具体专业、PO、课程模块、ECTS、毕业要求或官方考试日期。五学院与通用资源入口来自保留的项目 PRD；本地包只包含一个标记为 `unverified` 的考试条例导航来源。

用户输入的课程、ECTS、考试和任务始终显示为个人数据，不会作为 FAU 官方资料。规则或来源不完整时，毕业条件结果保持 `unknown`；即使全部本地计算条件满足，界面也只显示“可能满足”，并要求以官方文件和 Campo 为准。

## 已知限制

- 尚无经过人工核实的真实专业、PO、模块或学分要求，因此不能给出正式毕业判断。
- 尚无官方考试日期或报名期限；考试页只显示用户个人填写的数据。
- 无 FAU 登录、Campo/StudOn 数据读取、考试报名、自动同步或后台通知。
- JSON 备份暂不包含 localStorage 中的界面偏好和资源导航自定义数据。
- 弹窗具备语义、Escape 关闭与键盘可操作控件，但尚未完成独立屏幕阅读器和 400% 缩放人工认证。
- Playwright 需要本机已有依赖和浏览器；项目不会自动联网下载浏览器。
- 当前未生成依赖锁文件；首次经过批准的离线安装应生成并保留 `package-lock.json`。

## 如何添加真实 FAU 专业数据

不得根据专业名称、入学年份或“最新 PO”猜测数据。新增真实数据必须在应用之外人工取得官方材料，并全部在本地完成：

1. 在 `src/data/academic/academic-data.json` 的 `academicSources` 中登记官方 HTTPS 来源、发布者、文档类型、适用 scope、版本/章节、核对日期和核实状态。
2. 添加 Programme，并明确 `facultyId`、`degreeType`、方向和对应 PO ID。
3. 每个 ExaminationRegulationVersion 明确所属专业、适用入学学期范围、说明和至少一个来源 ID。
4. Module 与 ModuleVersion 分开录入；版本必须声明适用 PO、有效学期、来源及核实状态。无法确认的 ECTS 保持 `null`。
5. RequirementGroup 按各专业实际结构建立必修、限定选修、自由选修、论文、实习或附加要求；每条规则必须关联来源，未核实数据不得标为 `verified`。
6. 运行 schema、引用、PO 匹配、ECTS、翻译和构建测试。
7. 由人工逐项复核原文、页码/章节、适用专业和 PO。只有复核完成后才能更新 `lastVerifiedAt` 和 `verificationStatus`。

详细模型与政策见：

- `docs/ACADEMIC_DATA_MODEL.md`
- `docs/ECTS_ENGINE.md`
- `docs/EXAMS_TASKS.md`
- `docs/DATA_POLICY.md`
- `docs/TEST_PLAN.md`

原始需求文件保留在 `upload/PRD(1).md`，不得删除、覆盖或移动。
