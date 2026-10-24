# Contributing to FAU Study Navigator

Thanks for taking a look. This project exists because official FAU study
information is spread across Campo, StudOn, faculty pages and PDF regulations,
and nobody has time to cross-check all of it before every semester.

**Scope, stated plainly:** the data package currently covers **three master
programmes in the Faculty of Sciences (Department of Biology)**:

- Cell and Molecular Biology (M.Sc.)
- Integrated Life Sciences (M.Sc.)
- Integrated Immunology (M.Sc.)

Every other faculty and programme is missing on purpose, because each one needs
its regulations transcribed and checked by a person. The most useful
contribution is usually **your own faculty's data**.

## The one rule that matters

**Never guess academic data.** A plausible-looking ECTS number or a made-up
deadline is worse than a visible gap, because a student may plan a semester
around it.

- Do not infer a module list from a programme name, an entry year, or "the
  newest PO".
- If a value cannot be confirmed from an official document, leave it `null` or
  mark the rule `needs_review` / `unverified`.
- Every rule must name the official source it came from.
- "The schema validates" is not "the content is true". Only a human check
  against the PDF makes something `verified`.

## Quick start

```bash
npm ci
npm run dev          # http://127.0.0.1:5173
```

Always use `127.0.0.1`, not `localhost`. Browsers treat them as different
sites, so your local data appears to vanish if you switch.

## Quality gates

All of these must pass before a pull request is merged:

```bash
npm run lint
npm run typecheck
npm run test          # static checks + unit tests
npm run test:data     # academic data integrity
npm run build
npm run test:e2e      # needs: npx playwright install chromium
```

Please run at least `lint`, `typecheck`, `test`, `test:data` and `build`.
End-to-end tests take a few seconds once Chromium is installed.

## Ways to contribute

### 1. Add your faculty's programmes (most valuable)

Follow [docs/ADDING_A_FACULTY.md](docs/ADDING_A_FACULTY.md). It walks through
finding the official examination regulations, registering sources, adding a
programme, its PO versions, modules and requirement groups, and what the tests
will check.

You do not have to cover a whole faculty at once. One programme with its real
PO and module table is already useful.

### 2. Correct something that is wrong

Open an issue with the
[data correction template](.github/ISSUE_TEMPLATE/data_correction.yml). Include:

- the programme, PO code and module,
- what the app currently says,
- what the official document says,
- a link to the official page or PDF and the page number.

### 3. Improve the app

Bugs, accessibility, translations, the ECTS engine and the timetable are all
fair game. Small, focused pull requests are easier to review than large ones.

### 4. Translations

Simplified Chinese (`zh-CN`) is the default; English (`en`) must stay at full
parity. A test fails if the key sets differ or a string is empty. Keep official
German terms (`Prüfungsordnung`, `Modulhandbuch`) where they are the real name
of the thing.

## Data checklist for a data pull request

- [ ] `academicSources` has an HTTPS entry per document, with publisher, type,
      `lastCheckedAt` and `verificationStatus`.
- [ ] The programme names its `facultyId`, `degreeType` and PO versions.
- [ ] Each PO declares the entry-semester range it applies to.
- [ ] Modules and module versions are separate records; unknown ECTS stay `null`.
- [ ] Requirement groups mirror the actual structure of the regulation, not an
      approximation of it.
- [ ] A human read the regulation and recorded the page/section for each rule.
- [ ] `npm run test:data` and `npm run test` pass.
- [ ] `src/data/coverage.test.ts` needed no edit. It pins the three biology
      programmes and structural invariants, not the absence of other faculties;
      if you had to weaken it, something is wrong with the change.

## Commit messages

Write the subject in the imperative mood, in English, and explain *why* in the
body. Say what you verified and how, and mention the test counts you ran. If you
found a bug while testing, say what caused it.

```text
Add the Physics M.Sc. skeleton from the 2025 FPO

The faculty index lists 15 master programmes; three are already in the
package. This adds the Physics programme, its 2025 PO and the source record.
Module table is not transcribed yet, so the PO stays needs_review.

Tests: 120 unit, data checks pass.
```

## Pull request checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:data`
      and `npm run build` pass locally.
- [ ] New user-visible strings exist in both `zh-CN` and `en`.
- [ ] No personal data, tokens, cookies or browser dumps committed.
- [ ] Academic claims are source-backed, or status is honest.
- [ ] If UI changed, a screenshot or a short description is included.

## What we deliberately do not do

- No backend, accounts, telemetry, analytics, or runtime calls to FAU systems.
- No scraping at runtime: the app ships a versioned data package.
- No Campo/StudOn automation, no exam registration on the student's behalf.
- No demo data that looks real. Empty means empty.
- **No commercial use.** No advertising, affiliate links, sponsorships, paid
  features or donation drives. The project stays non-commercial; see
  [LEGAL.md](LEGAL.md).
- **No tracking.** No cookies, analytics, pixels or fingerprinting, and no
  third-party fonts or CDNs. Local storage only where the feature truly needs
  it (currently: preferences and the user's own study data).
- **No copying of protected material.** Official regulations may be quoted;
  module handbooks and other copyrighted documents stay with their rights
  holder. Do not paste a full handbook into the repository.

Any pull request that weakens these rules will be rejected, even if the feature
itself is useful.

## Licence

By contributing you agree that your code is licensed under the [MIT
License](LICENSE). Official FAU documents quoted or stored in `sources/` remain
FAU's property and are not covered by that licence; see [NOTICE.md](NOTICE.md).

---

# 中文说明

## 项目范围

数据包目前只覆盖**自然科学学院生物系的三个硕士专业**：细胞与分子生物学、
整合生命科学、整合免疫学。其他学院与专业不是忘了做，而是需要人工对照官方
考试条例逐条转录并核实。**最受欢迎的贡献就是补上你自己学院的数据。**

## 唯一不能破的规则

**绝不猜测学术数据。** 看起来合理的 ECTS 数字比一个明显的空白更危险。

- 不根据专业名称、入学年份或「最新 PO」推断模块表。
- 无法从官方文件确认的数值保持 `null`，或把规则标为 `needs_review`。
- 每条规则必须绑定来源。
- schema 校验通过不等于内容真实；只有人工对照 PDF 才能标 `verified`。

## 非商业与隐私底线（德国法背景）

- 不加入广告、联盟链接、赞助、付费功能或募捐；项目保持非商业，详见 [LEGAL.md](LEGAL.md)。
- 不加入 Cookie、分析工具、像素、指纹识别或第三方字体/CDN；不得引入后台网络请求。
- 不提交受版权保护的整本手册或大段原文；官方条例可引用，模块手册仅作核对。
- 不在公开 issue 或测试 fixture 中放入任何个人成绩、邮箱或 FAU 凭据。

## 本地开发与门禁

```bash
npm ci
npm run dev
npm run lint && npm run typecheck && npm run test && npm run test:data && npm run build
```

只使用 `127.0.0.1`，不要与 `localhost` 混用。

## 常见贡献方式

1. **补你所在学院的专业**：见 [docs/ADDING_A_FACULTY.md](docs/ADDING_A_FACULTY.md)。
2. **纠错**：用数据纠错 issue 模板，给出专业、PO、模块、官方链接和页码。
3. **改功能**：小步提交，说明为什么。
4. **翻译**：中英文键必须一一对应，有测试会失败提醒。

提交代码即表示同意以 [MIT 许可证](LICENSE) 授权。`sources/` 下的官方文件
版权归 FAU，不在此许可证范围内。
