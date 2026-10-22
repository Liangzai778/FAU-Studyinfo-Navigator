# P4 ECTS Engine & Semester Planner

## 1. 边界

P4 复用 P3 的 Programme、PO、ModuleVersion、RequirementGroup、AcademicSource 与核实状态。新增的 `LocalCourse` 和 `CourseAttempt` 只表示用户在浏览器中保存的个人计划和学习历史，不会写回公共学术数据包，也不会被展示为 FAU 官方课程。

规则引擎位于 `src/domain/ectsEngine.ts`，是无 React、DOM、IndexedDB 或网络依赖的纯函数。

## 2. 学习记录

- `LocalCourse`：稳定的用户课程身份、用户输入名称、ECTS、可选 Module/ModuleVersion 映射、额外课程标记和是否允许计入毕业学分。
- `CourseAttempt`：一次修读记录，包含学期、`planned | in_progress | passed | failed | recognized`、认定确认、记录创建时的 PO 与要求组。
- 重修不会覆盖旧记录，而是为同一 `courseId` 新增 CourseAttempt。
- PO 变化不会迁移或重写 attempt；引擎按当前 PO 重算，不匹配项产生风险提示。

## 3. 计算口径

| 输出 | 口径 |
|---|---|
| `completedEcts` | passed 或用户明确确认的 recognized；包含额外/不计毕业课程，用于显示真实完成历史 |
| `earnedEcts` | completed 中允许计入毕业、绑定当前 PO 且 ECTS 已知的课程 |
| `plannedEcts` | planned 或 in_progress、允许计入毕业、绑定当前 PO，且尚未成功完成的课程 |
| `group.earnedEcts` | earned 中显式分配到该组且符合模块范围的课程 |
| `group.plannedEcts` | planned 中显式分配到该组且符合模块范围的课程 |

同一 ModuleVersion 即使出现多个本地课程记录，也只计算一次。同一课程的 failed → passed 重修历史只计算成功结果一次。`recognized` 必须设置 `recognitionConfirmed: true`。

## 4. 要求组与结论

每个 RequirementGroup 独立计算 `earned / planned / required / missing`。以下任一情况会使该组或总毕业辅助结论为 `unknown`：

- 没有确认的 PO；
- 当前 PO 没有要求组；
- 规则状态不是 `verified`；
- 任一来源不存在或状态不是 `verified`；
- 要求组没有 `minEcts`；
- 课程缺少 ECTS、PO 不匹配、要求组不存在或模块不符合组范围。

只有所有适用组均为已核实、来源已核实、门槛明确且完成时，结果才为 `satisfied`。此结果仍只是辅助校验，不代表 FAU 的正式毕业审核。

## 5. IndexedDB

共享数据库升级为 v2，并保留 P3 数据：

```text
database: fau-study-navigator
academic-profile   P3 专业/PO 范围
planner-courses    P4 用户课程
planner-attempts   P4 学期与重修记录
```

课程与 attempt 全量快照在同一 readwrite transaction 中替换。新快照先通过 Zod 校验；校验或事务失败时，旧数据不被覆盖。

## 6. 测试隔离

规则引擎测试使用 `synthetic-test-only-*` 标识，覆盖计划/获得分离、失败、认定、重复模块、互斥组、PO 不一致、规则缺学分、来源未知、重修和额外课程。IndexedDB 集成测试使用 fake IndexedDB，仅运行虚构数据，不进入生产包或界面。
