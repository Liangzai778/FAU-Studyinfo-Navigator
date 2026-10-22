# FAU Study Navigator — 本地开发约束

本文件约束在本目录中工作的所有开发者与自动化代理。若与 `upload/PRD(1).md` 的历史执行建议冲突，以用户当前明确要求和本文件的本地优先约束为准。

## 1. 项目边界

- 本项目是独立学生工具，不是 FAU 官方服务，也不得暗示获得 FAU 认可。
- 当前阶段已获用户批准进入实现阶段，并批准联网安装依赖与发布到 GitHub 私有仓库。
- 所有代码、测试、文档、种子数据和生成物在本地项目目录中开发；代码托管使用 GitHub 私有仓库 `https://github.com/tommy2345-art/FAU-Study-Navigator`。
- 允许的远程操作：`git push` / `git pull` / `git fetch` 到上述仓库。仍然禁止：连接云数据库、远程数据采集服务、分析/遥测服务或在线 API；向公开位置发布；创建公开仓库（公开须经用户单独批准）。
- 依赖安装允许连接 npm 官方注册表；`package-lock.json` 必须提交，以保证构建可复现。
- 不删除、覆盖或移动原始 `upload/PRD(1).md`。后续如需标准路径 `docs/PRD.md`，必须保留原文件并经用户确认后复制。
- 应用目标是本地静态部署。生产运行时不得依赖后端、账号系统或网络数据接口。

## 2. 产品原则

优先级依次为：准确性、可追溯性、隐私、易用性、覆盖范围、自动化。

- 默认界面语言为简体中文 `zh-CN`，所有用户可见功能完整支持英文 `en`；必要的德文官方术语保留原文。
- 界面须简洁、移动优先、响应式、键盘可操作，并适合 FAU 学生使用。
- 导航主项最多六个：Dashboard、Degree requirements、Semester planner、Exams & deadlines、Resources、Sources & updates。
- 必须醒目标注“独立学生工具”；法律效力、考试报名、课程报名和成绩以 FAU 官方文件及 Campo 为准。
- 不请求或保存 FAU SSO 凭据，不模拟或声称完成 Campo/StudOn 操作。

## 3. 学术数据红线

- 绝不伪造课程、模块、ECTS、考试日期、前置条件、毕业要求、开课周期或来源。
- 无法确认的数据必须使用 `unknown`、`unverified`、`tentative`、`needs_review` 或 `conflict` 等明确状态；不得用看似真实的占位值。
- 所有重要学术规则和日期必须绑定来源元数据、适用专业、适用 PO 版本及人工核验状态。
- 专业要求必须按 `degreeType + facultyId + programmeId + entrySemester + poVersionId` 解析；不得按学院或“最新 PO”粗略套用。
- 用户无法确认 PO 时，引导其在 Campo 自行核对；系统不得自动选择最新版本。
- `planned`、`in_progress`、`failed`、考试已登记状态均不计入 earned ECTS；仅 `passed` 与经用户正式确认的 `recognized` 可计入。
- 模块版本必须可区分；互斥要求组不得重复计分；规则不完整时，毕业满足结论返回 `unknown`。
- 日期使用 `Europe/Berlin` 语义存储和显示，并保留 `confirmed | tentative | unknown` 状态。

## 4. 本地数据与网络策略

- 个人学习记录默认存 IndexedDB；仅主题、语言等低敏设置可存 localStorage。
- 提供本地 JSON 导入、导出和彻底清空；导入必须做 schema、版本、大小与内容校验。
- 公共规则使用随应用发布的版本化本地数据包；更新由维护者离线获取并人工核验后导入，应用本身不抓取网页。
- 禁止遥测、广告、远程日志、第三方字体/CDN、运行时远程脚本和静默网络请求。
- 官方链接只能作为清晰标注的外部导航，由用户主动点击；它们不是应用数据来源接口。
- 默认 CSP 采用 `default-src 'self'`，仅在确有用户主动外链导航需求时允许浏览器离站，不开放 `connect-src` 远程目标。

## 5. 架构与实现纪律

- 目标技术栈：Vite、React、TypeScript strict、React Router、单一状态方案、Zod、Dexie、Vitest、Testing Library、Playwright。
- 领域规则放在纯 TypeScript 模块，禁止把学分或 PO 判断硬编码进 React 组件。
- Zod schema 是运行时数据契约；TypeScript 类型从 schema 推导，避免双份类型漂移。
- 公共参考数据、个人记录、界面设置分层存储；不得互相写回或混用。
- 数据迁移必须显式、可回滚验证，并保留原始导入数据直到新版本校验成功。
- 不修改无关文件，不用虚假按钮或未实现操作伪装完成。

## 6. 质量门禁

每个阶段必须满足 `docs/DEVELOPMENT_PLAN.md` 的验收标准，并有对应自动化测试。进入后续阶段前，本地质量门禁必须全部通过：

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

- 测试不得访问真实网络；外链、时间、文件导入和浏览器 API 必须 mock 或使用本地 fixture。
- 测试固定时钟并显式覆盖 Europe/Berlin 的 DST 边界。
- 自动化测试不能替代学术规则的人工核验；“schema 合法”不等于“内容真实”。
- 任何涉及学术含义的数据变更须通过来源证据检查与人工复核清单。

## 7. 变更流程

1. 先阅读 PRD、本文件及 `docs/` 下相关设计文档。
2. 明确本次阶段、范围和非目标；发现冲突先记录，不自行扩大范围。
3. 先补测试/fixture 与数据契约，再实现最小垂直切片。
4. 仅使用本地 fixture 和人工核验的数据包。
5. 运行当前阶段全部本地检查，记录通过证据与已知限制。
6. 质量门禁全部通过后，可提交并推送到 GitHub 私有仓库；不得推送到公开仓库或发布到任何公开托管。

