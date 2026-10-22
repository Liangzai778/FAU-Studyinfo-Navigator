# 本地首次完整验证报告

日期：2026-10-22
项目：`G:\FAU-Study-Navigator-complete\FAU-Study-Navigator`
验证人：自动化代理（OpenClaw），按用户授权执行

本报告记录项目在**首次安装依赖后**的完整质量门禁执行结果。所有数字均为该次运行的真实输出，不是预期值。

## 1. 环境

| 项目 | 值 |
|---|---|
| Node.js | v24.14.1 |
| npm | 11.11.0 |
| 操作系统 | Windows (10.0.26300 x64) |
| Playwright Chromium | chromium-1248（本次新安装） |

依赖通过 npm 官方注册表安装，`package-lock.json` 已生成并纳入版本控制。

## 2. 质量门禁结果

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run test:static` | **通过 32/32** | node:test 静态契约测试，无需第三方依赖 |
| `npm run typecheck` | **通过，0 错误** | `tsc -b` |
| `npm run test` | **通过 38/38**（13 个文件） | 32 项 static + 6 项 Vitest |
| `npm run build` | **通过** | 87 modules，产物见 `dist/` |
| `npm run lint` | **通过，0 错误 0 警告** | `eslint .` |
| `npm run test:e2e` | **通过 7/7，跳过 2** | 3 个 viewport，2 项跳过为 mobile 专用用例的预期跳过 |

## 3. 首次完整检查发现并修复的问题

依赖缺失掩盖了以下真实缺陷，首次完整运行后暴露并修复：

### 3.1 Vitest 收集了不属于它的测试文件

**现象**：`npm run test` 报 6 个文件 `No test suite found`，另有 Playwright 报错 `Playwright Test did not expect test() to be called here`。

**原因**：`vite.config.ts` 未配置 `test.include`，Vitest 默认把 `tests/*.test.mjs`（node:test 格式）和 `tests/e2e/smoke.spec.ts`（Playwright 格式）一并收集。

**修复**：限定 Vitest 只收集 `src/**/*.test.{ts,tsx}`，排除 `tests/**`。
node:test 与 Playwright 各自通过自己的 runner 运行。

### 3.2 React 反模式：在 effect 中同步 setState（4 处）

**位置**：`ExamForm.tsx`、`TaskForm.tsx`、`CourseForm.tsx`、`DegreePage.tsx`

**原因**：前三者用 `useEffect` 把 `editing` prop 同步进表单状态。React 官方明确指出这是反模式，会触发级联渲染。

**修复**：
- 三个表单改为 `useState` 惰性初始化，由父组件用 `key={editing?.id ?? 'new'}` 在编辑目标变化时重新挂载。行为等价，且消除级联渲染。
- `DegreePage` 的那处是从 IndexedDB 水合后填充表单，属于「外部系统 → React」的合法同步，保留并在行级注明原因。

### 3.3 未使用的参数

`ErrorBoundary.componentDidCatch(_error, _info)` 两个参数均未使用，改为无参签名（该方法签名允许），同时移除不再需要的 `ErrorInfo` 导入。

### 3.4 E2E 并发超时

**现象**：全量 `npm run test:e2e` 时 6/9 失败，均为 30s 超时；单 project 运行时全部通过。

**原因**：`fullyParallel` 下 9 个 worker 同时打同一个 Vite **dev server**，dev server 按需编译模块，首次请求慢，叠加争抢后触发超时。

**修复**：`playwright.config.ts` 的 `webServer.command` 改为 `npm run build && npm run preview -- --port 4173`，限制 `workers: 3`，`reuseExistingServer: false`，超时放宽至 180s。
E2E 现在验证的是**真实生产构建产物**，比 dev server 更接近用户实际使用场景。

### 3.5 缺少 `.gitignore`

项目无 `.gitignore`，`node_modules/`（200 个目录）和 `dist/` 会被误提交。已补，排除依赖、构建产物、测试产物、日志、环境文件和编辑器配置。

## 4. 人工验收

脚本 `scripts/manual-verify.mjs` 在三个 viewport（1440×900 / 768×1024 / 390×844）下遍历全部 7 条路由：

```
desktop  /            h1="学习导航概览"
desktop  /degree      h1="专业要求"
desktop  /planner     h1="学期规划"
desktop  /exams       h1="考试与截止日期"
desktop  /resources   h1="校园导航"
desktop  /settings    h1="设置"
desktop  /missing     h1="找不到此页面"
```

tablet 与 mobile 结果相同。共 21 次页面加载，**无 console 错误、无 pageerror、无空白页**。
截图保存在 `verification-shots/`（已在 `.gitignore` 中排除）。

## 5. 已知限制（不随本次修复改变）

- **真实 FAU 学术数据仍为空。** 这是有意的设计决定，避免把演示数据误认为官方规定。应用可用于个人规划，但**目前不能判定毕业条件**。
- 专业、PO、课程、ECTS 与考试规则需依据官方文件人工录入，并登记来源、适用范围和核验状态。
- 生产包 JS 单文件 494 kB（gzip 140 kB），未做代码分割。对当前功能规模可接受，后续可优化。
- 浏览器端人工验收由脚本完成（含截图），尚未进行真人逐项点击检查。

## 6. 发布记录

| 项目 | 值 |
|---|---|
| 仓库 | `https://github.com/tommy2345-art/FAU-Studyinfo-Navigator` |
| 可见性 | 私有 |
| 分支 | `main` |
| 首次提交 | `ca1ed21` Initial commit |
| 文档更新提交 | `6e67c7d` Align README with the actual install workflow |
| 纳入版本控制的文件 | 99 |

`.gitignore` 已排除 `node_modules/`、`dist/`、`test-results/`、`playwright-report/`、`verification-shots/`、日志和环境文件，仓库体积 197 KiB。

## 7. 复现方式

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium   # 首次
npm run test:e2e
```
