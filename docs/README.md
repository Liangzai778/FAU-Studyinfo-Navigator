# 文档索引

不知道从哪看起时，按你的目的查这张表。

## 我想用这个工具

| 文件 | 内容 |
|---|---|
| [USER_GUIDE.md](USER_GUIDE.md) | **使用指南**：第一次使用的五步、状态说明、备份与常见问题 |
| [README](../README.md) | 在线地址、覆盖范围、本地开发、数据保存位置 |
| [LEGAL.md](../LEGAL.md) | 非商业声明、数据保护（DSGVO/BDSG）、版权与不抓取承诺 |

## 我想补上自己学院的数据（最需要人做的事）

| 文件 | 语言 | 内容 |
|---|---|---|
| [ADDING_A_FACULTY.zh-CN.md](ADDING_A_FACULTY.zh-CN.md) | 中文 | **从这里开始。** 十步流程、培养计划到规则组的映射、报错对照表、常见问题 |
| [ADDING_A_FACULTY.md](ADDING_A_FACULTY.md) | English | 同一份指南的英文版 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 中英 | 开发环境、质量门禁、数据红线、PR 流程 |
| [ROADMAP.md](../ROADMAP.md) | 中英 | 哪些事最缺人、从哪开始、哪些不做 |

## 我想了解项目怎么设计

| 文件 | 内容 |
|---|---|
| [DESIGN.md](DESIGN.md) | 总体架构、数据模型（ER 图）、关键取舍、安全与扩展方式 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 更细的分层、路由与状态边界 |
| [ACADEMIC_DATA_MODEL.md](ACADEMIC_DATA_MODEL.md) | 数据字段与 PO 模型 |

## 我想改代码

| 文件 | 内容 |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 分层、路由、状态、存储边界 |
| [ACADEMIC_DATA_MODEL.md](ACADEMIC_DATA_MODEL.md) | Faculty → Programme → PO → Module → RequirementGroup 数据模型 |
| [ECTS_ENGINE.md](ECTS_ENGINE.md) | 学分引擎的输入、规则与不变量 |
| [EXAMS_TASKS.md](EXAMS_TASKS.md) | 考试、任务、柏林时区与 ICS |
| [TEST_PLAN.md](TEST_PLAN.md) | 测试分层与固定时钟、DST 边界要求 |

## 我想知道项目现在到底什么状态

| 文件 | 内容 | 时效 |
|---|---|---|
| [PROJECT_LOG.md](PROJECT_LOG.md) | 完整变更历史、决策记录、当前缺口与待办 | **持续更新，以此为准** |
| [PROJECT_AUDIT_2026-10-24.md](PROJECT_AUDIT_2026-10-24.md) | 2026-10-24 全面审视：功能、内容、展示、数据、质量与问题清单 | 2026-10-24 快照 |
| [SCALABILITY_AUDIT.md](SCALABILITY_AUDIT.md) | 源码级审计：数据规模、ECTS 算术、已修与未修项 | 2026-10-23 审计 + 10-24 状态更新 |

## 历史与归档

这些文件记录了当时的阶段，数字可能已经过期，不作为现状依据：

| 文件 | 内容 |
|---|---|
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | P0–P6 开发计划 |
| [P6_ACCEPTANCE_REPORT.md](P6_ACCEPTANCE_REPORT.md) | P6 验收报告 |
| [LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md) | 本地验证与发布记录 |
| [DATA_POLICY.md](DATA_POLICY.md) | 数据政策 |

## 维护者工具

| 文件 | 内容 |
|---|---|
| [analytics/README.md](../analytics/README.md) | **访问统计（可选、默认关闭）**：Cloudflare Worker + KV + 看板；隐私设计、部署、接入步骤与法律措辞 |
