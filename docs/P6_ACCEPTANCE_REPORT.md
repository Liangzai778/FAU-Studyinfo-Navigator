# P6 最终质量验收报告

验收日期：2026-10-22  
范围：当前本地 FAU Study Navigator 工作目录  
结论：**有条件未通过发布门禁**。源码审计和无依赖测试通过，但本地依赖未安装，无法完成 ESLint、TypeScript、完整 Vitest、Playwright 和 Production build，因此不能宣称发布候选已完全验收。

## 1. 环境与边界

- Node.js：v24.19.0
- npm：11.9.0
- `node_modules`：不存在
- `package-lock.json`：不存在
- 网络：未访问；未安装或下载任何远程依赖/浏览器
- GitHub/部署：未执行
- 原始 PRD SHA256：`5e53892eb330f9e57994251515693008f0227d4deb4b4fdeacdbe30d992ea5d4`

## 2. 本轮修复

1. Dashboard 不再固定显示 P1 阶段的“暂无进度/未选择 PO”状态；现在从 IndexedDB 状态仓库读取专业范围、课程、ECTS、考试和任务，并只展示用户本地数据。
2. 设置页新增完整本地数据清空：二次确认后，在单个 IndexedDB 事务中清空五个个人数据仓库，并重置收藏、个人网站、分类、语言和主题状态。
3. JSON 备份入口移至设置页，避免数据管理功能隐藏在考试页面。
4. 修正已经实现 PO 选择后仍声称“后续阶段加入”的过期中英文文案。
5. 延迟释放 JSON/ICS 下载的 Object URL，提高跨浏览器下载可靠性。
6. 增加 Playwright 本地 E2E 配置，覆盖桌面、平板、手机视口、全部路由、双语/主题/收藏刷新持久化和非 localhost 请求拦截。
7. README 更新为完整本地安装、启动、存储、备份、功能、限制和真实 FAU 数据录入说明。

## 3. 自动化命令结果

| 命令 | 实际结果 | 说明 |
|---|---|---|
| `npm run test:static` | 通过，32/32 | 实际执行 Node 静态检查、PO 匹配、ECTS、Berlin DST、ICS 与防重复计分用例 |
| `npm run lint` | 未运行到 ESLint | `eslint: not found` |
| `npm run typecheck` | 未运行到 TypeScript | `tsc: not found` |
| `npm run test` | 部分通过 | `test:static` 32/32；随后 `vitest: not found` |
| `npm run test:e2e` | 未运行到 Playwright | `playwright: not found`，浏览器也未下载 |
| `npm run build` | 未运行到构建 | 首步 `tsc: not found`，未生成 `dist/` |

这些结果属于环境阻断，不等同于 ESLint、类型、Vitest、E2E 或构建通过。

## 4. 十七项验收结论

| # | 检查项 | 状态 | 证据与结论 |
|---|---|---|---|
| 1 | 所有页面可访问 | 条件通过 | 六个路由、重定向和 404 已静态检查；Playwright 路由 smoke 已编写，但未实际运行 |
| 2 | 所有按钮有实际功能 | 源码审计通过 | 按钮均绑定事件、表单提交、文件选择或有效导航；未发现 `href="#"` 伪导航或空回调 |
| 3 | 中英文切换完整 | 静态通过 | 中英文键集合一致、无空值，32 项门禁包含翻译键检查；浏览器 E2E 未运行 |
| 4 | 桌面/平板/手机正常 | 待浏览器确认 | 响应式布局及 1440×900、768×1024、390×844、320×568 E2E 已配置；未实际渲染 |
| 5 | 收藏和设置刷新不丢失 | 实现并有测试 | localStorage 持久化及组件/Vitest/E2E 用例存在；Vitest/E2E 因依赖缺失未运行 |
| 6 | 学分计算满足测试 | 通过 | Node 实际执行 planned/passed/failed/recognized、重修、额外课程等测试 |
| 7 | 互斥学分不重复计算 | 通过 | 实际执行同一模块跨互斥组测试，总计只计一次 |
| 8 | 不错误宣称毕业满足 | 通过 | 无规则/来源不全返回 `unknown`；满足时文案为“可能满足”，并保留官方免责声明 |
| 9 | PO 版本匹配正确 | 通过 | 实际执行重叠候选、不自动选最新版、跨学院/专业拒绝、显式确认测试 |
| 10 | 考试日期和状态正确 | 核心逻辑通过 | 实际执行 Berlin 正常时间、DST 跳时拒绝、重复时段识别与 ICS 时间测试；UI E2E 未运行 |
| 11 | JSON 导入导出安全可恢复 | 实现，集成测试待运行 | schema/版本/2 MiB/深度/危险键/ID 冲突/事务恢复存在；fake-indexeddb Vitest 未运行 |
| 12 | 正式规则具备来源 | 通过 | 生产正式规则为 0；本地审计确认不存在无来源正式规则，唯一来源记录标为未核实 |
| 13 | 未核实数据明显标记 | 通过 | Degree、Resources、Planner 均有 `unverified/pending/unknown` 标签和说明 |
| 14 | 无个人数据泄漏 | 源码审计通过 | 无 telemetry、远程日志、console 数据输出；个人记录只进本地存储和用户主动下载 |
| 15 | 无自动远程 API | 通过 | 源码扫描无 fetch/XHR/WebSocket/EventSource/sendBeacon；CSP 仅允许同源连接 |
| 16 | 静态资源本地加载 | 源码通过，构建待确认 | HTML 无 CDN、远程字体/脚本/样式；Production build 因 `tsc` 缺失未运行 |
| 17 | 无伪功能或占位按钮 | 源码审计通过 | 未发现 coming-soon 按钮、空点击处理器或假报名/假同步功能；不可用功能使用真实空状态说明 |

## 5. 学术准确性审计

- 生产数据包包含五学院、零专业、零 PO、零模块、零 RequirementGroup，未放入演示课程或虚构 ECTS。
- 唯一学术来源是考试条例官方总入口，状态为 `unverified`、`lastVerifiedAt: null`。
- 官方考试日期数组为空；考试页面只显示 `origin: personal`、`dateStatus: user_entered` 的用户记录。
- PO 候选由 degree type、faculty、programme 和 entry semester 共同过滤，最终必须由用户明确确认。
- ECTS 引擎只把 `passed` 和用户确认的 `recognized` 计入完成；PO 不匹配、来源未知、规则未核实均阻止肯定毕业结论。

## 6. 隐私与离线审计

- 生产源码未发现后台网络客户端。
- HTML 不加载 CDN、远程图片、字体或脚本。
- 外部 HTTPS 链接只在用户点击后以 `noopener noreferrer` 打开。
- JSON 和 ICS 在浏览器内存中生成下载，不上传。
- 本地彻底清空使用明确二次确认；测试覆盖文件已加入，但需 Vitest 执行。

## 7. 发布阻断与复验步骤

当前最大阻断是缺少经过批准的离线依赖和锁文件。准备本地依赖缓存后执行：

```bash
npm install --offline --cache /absolute/path/to/approved-npm-cache
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run preview
```

随后需要人工完成键盘操作、屏幕阅读器基础检查、200%/400% 缩放，以及四个目标视口的视觉检查。只有所有门禁实际通过并记录生产包网络行为后，才能将结论提升为 P6 完全通过。
