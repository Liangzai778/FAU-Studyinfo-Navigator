# 访问统计（可选）

一个很小的自建统计服务：一个 Cloudflare Worker + KV，一个静态看板页面。

**默认不接入主站。** 主站现在承诺「无分析、无追踪、无后台请求」，这份代码不会自动生效；是否启用由你决定。启用前必须同步修改法律声明和测试，见下面「启用前必须改的四件事」。

---

## 先选方案

| 方案 | 能回答什么 | 代码改动 | 隐私 |
|---|---|---|---|
| **A. Cloudflare Web Analytics** | 访问量、热门页面、来源、国家 | 无 | 无 Cookie、聚合 |
| **B. 本目录的自建计数器** | 访问量 + 自定义功能事件（保存专业、加课、加日程…） | 需要接入客户端 | 无 Cookie、无访客 ID、不存 IP、90 天自动删除 |

只需要「多少人看了」就用 A，Cloudflare 后台点几下即可。需要「多少人真的用了某个功能」才需要 B。

---

## 这个计数器存什么

- 键：`p:<日期>:<路径>` 与 `e:<日期>:<事件>`，值是整数计数。
- 不存：IP、User-Agent、Cookie、访客 ID、来源页、任何用户输入。
- 日期按 `Europe/Berlin` 计算；计数 90 天后由 KV 的 `expirationTtl` 自动过期。
- 统计是**近似值**：KV 的读改写不是原子操作，并发时可能少记一两次；适合了解大致使用情况，不适合计费或审计。

---

## 部署 Worker

需要 Node 20+ 和一个 Cloudflare 账号。

```bash
cd analytics/worker
npm install
npx wrangler login

# 1. 创建 KV 命名空间，复制输出里的 id
npx wrangler kv namespace create COUNTERS

# 2. 把 id 填进 wrangler.toml 的 [[kv_namespaces]]
#    同时把 ALLOWED_ORIGINS 改成你的站点地址

# 3. 设置看板读取令牌（自己生成一串长随机值）
npx wrangler secret put STATS_TOKEN

# 4. 部署
npx wrangler deploy
```

部署成功后会得到一个 `https://fau-study-stats.<你的子域>.workers.dev` 地址。

本地联调：

```bash
npx wrangler dev
curl -X POST http://127.0.0.1:8787/collect \
  -H 'Origin: http://127.0.0.1:5173' \
  -H 'Content-Type: text/plain' \
  -d '{"path":"/"}'
curl -H 'Authorization: Bearer <STATS_TOKEN>' \
  'http://127.0.0.1:8787/stats?days=7'
```

`ALLOWED_ORIGINS` 默认已包含线上站点和本地开发地址；换成你的域名时用逗号分隔。

---

## 部署看板

看板是纯静态页面，可以放 Cloudflare Pages、任何静态托管，或者本地打开。

```bash
# 方式一：Cloudflare Pages（会自动得到一个网址）
npx wrangler pages deploy analytics/dashboard --project-name fau-study-stats

# 方式二：本地预览（不需要部署）
npx serve analytics/dashboard
# 或 python -m http.server 8080 --directory analytics/dashboard
```

打开后填两样东西：

1. 统计服务地址（Worker 的 URL）
2. `STATS_TOKEN`

令牌只存在当前标签页的 `sessionStorage`，关闭标签页就没了；服务地址存在 `localStorage`。

想先看长什么样：看板地址后加 `?demo=1`，会用演示数据渲染，不发任何请求。

---

## 接入主站（可选）

`client/usage.ts` 是给主站用的客户端。**默认放在 `src/` 之外，不参与构建。**

### 1. 复制客户端

```bash
cp analytics/client/usage.ts src/analytics/usage.ts
```

### 2. 记录页面访问

在 `src/components/layout/AppShell.tsx` 里：

```tsx
import { trackPageView } from '../../analytics/usage';

const { pathname } = useLocation();
useEffect(() => {
  trackPageView(pathname);
}, [pathname]);
```

### 3. 记录功能事件

只在明确的操作成功后调用，事件名固定，不传任何用户内容：

| 事件名 | 触发点 |
|---|---|
| `degree_saved` | 保存专业与 PO 成功后 |
| `course_added` | 添加课程成功后 |
| `retake_added` | 添加重修后 |
| `calendar_event_added` | 保存个人日程后 |
| `backup_exported` | 导出备份后 |
| `backup_restored` | 恢复备份成功后 |

```ts
import { trackEvent } from '../../analytics/usage';
trackEvent('course_added');
```

### 4. 配置地址

`.env.production`：

```dotenv
VITE_ANALYTICS_URL=https://fau-study-stats.<你的子域>.workers.dev
```

Cloudflare Pages 也可以在 **Settings → Environment variables** 里加同名变量。不设置时客户端是空操作。

---

## 启用前必须改的四件事

主站现在明确写着「没有分析工具」。启用统计后如果不改，网站就在说谎。

### 1. CSP

`index.html` 的 `connect-src` 要允许 Worker 域名：

```html
connect-src 'self' https://fau-study-stats.<你的子域>.workers.dev
```

### 2. 测试

- `tests/static.test.mjs` 目前的「no background networking」会禁止 `fetch` / `sendBeacon`。需要把 `src/analytics/usage.ts` 排除，或改成只允许这个文件。
- `tests/e2e/smoke.spec.ts` 的 `rejectRemoteRequests` 会拦截所有非本地请求。E2E 构建时不要注入 `VITE_ANALYTICS_URL`，否则要把 Worker 域名加入白名单。

### 3. 法律声明

`LEGAL.md` 与 `/legal` 页要如实写清「聚合、无 Cookie 的访问计数」。可直接改这两段：

- `LEGAL.md` §3.2「Nicht verarbeitet」里的「keine Analyse- oder Trackingdienste」
- `src/i18n/messages.ts` 的 `legal.privacyNoTracking` / `legal.privacyIntro`

参考措辞：

> **Deutsch:** Zur Reichweitenmessung werden aggregierte, cookielose Zähler verwendet: pro Tag und Pfad sowie pro Tag und Funktionsereignis wird ein Zähler erhöht. Es werden keine Cookies gesetzt, keine Besucher-IDs gebildet und keine IP-Adressen gespeichert; die IP-Adresse wird nur technisch zur Auslieferung der Anfrage verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die Zähler werden nach 90 Tagen automatisch gelöscht.
>
> **English:** Aggregate, cookieless counters are used for reach measurement: one counter per day and path, and one per day and feature event. No cookies are set, no visitor IDs are created, and no IP addresses are stored; the IP is processed only to deliver the request. The legal basis is Art. 6(1)(f) GDPR. Counters are deleted automatically after 90 days.
>
> **中文：** 使用聚合、无 Cookie 的计数：按天与路径、按天与功能事件各计一次。不设置 Cookie、不生成访客 ID、不保存 IP 地址；IP 仅用于交付请求。依据 DSGVO 第 6 条第 1 款 f 项（合法利益）。计数 90 天后自动删除。

### 4. AGENTS.md

在数据/隐私约束里补一条：统计只能聚合、不得加入 Cookie/访客 ID/第三方脚本，且必须与 `LEGAL.md` 同步。

---

## 接口

### `POST /collect`

请求体（≤1 KB）：

```json
{ "path": "/planner" }
{ "event": "course_added" }
```

- `Origin` 必须在 `ALLOWED_ORIGINS` 中；
- `path` 以 `/` 开头，最长 160，去掉 query/hash；
- `event` 只允许 `[a-z0-9_.-]`，最长 64；
- 成功返回 `204`。

### `GET /stats?days=30`

需要 `Authorization: Bearer <STATS_TOKEN>`，`days` 范围 1–90。

```json
{
  "generatedAt": "2026-10-24T21:00:00.000Z",
  "days": 30,
  "totals": { "pageViews": 1234, "events": 456 },
  "pages": [{ "path": "/degree", "count": 321 }],
  "events": [{ "event": "course_added", "count": 88 }],
  "daily": [{ "date": "2026-10-24", "pageViews": 40, "events": 12 }]
}
```

---

## 限制

- 不是独立访客数：没有访客 ID，所以只能看次数，不能算 UV。
- 计数是近似的（KV 非原子递增）。
- 没有机器人过滤；异常流量会算进去。
- 没有保留策略设置界面；固定 90 天。
- 看板令牌在 `sessionStorage`，不要在公共电脑上保存。
