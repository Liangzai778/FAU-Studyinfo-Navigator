# FAU Academic Data Model（P3）

## 1. 范围

P3 建立学业规则的数据契约、离线数据包、专业/PO 选择和来源展示，不录入未经人工核实的 FAU 专业、模块、ECTS 或毕业要求。运行时不请求远程数据。

生产数据包位于 `src/data/academic/academic-data.json`，由 `src/data/academicData.ts` 在应用启动时通过 Zod 解析。当前包只包含 PRD 已列明的五学院，以及一个标为 `unverified` 的 FAU 考试条例官方导航入口；专业、PO、模块和要求组数组有意为空。

## 2. 实体与关系

| 实体 | 归属与版本边界 | 关键约束 |
|---|---|---|
| `Faculty` | 顶层学院 | ID 固定为五学院枚举 |
| `DegreeType` | Bachelor 或 Master | 专业必须明确学位类型 |
| `Programme` | 属于一个 Faculty + DegreeType | 显式列出 Track 和 PO 版本 ID |
| `ProgrammeTrack` | 属于一个 Programme | 有来源及核实状态 |
| `EntrySemester` | 年份 + Summer/Winter | 只筛选 PO 候选，不决定 PO |
| `ExaminationRegulationVersion` | 属于一个 Programme | 具有稳定 ID、适用入学学期范围、来源和状态 |
| `Module` | 可服务一个或多个 Programme | 只表示稳定模块身份，不存版本化学分 |
| `ModuleVersion` | 属于一个 Module | 按有效学期和适用 PO 区分；ECTS 可为 `null` |
| `RequirementGroup` | 属于一个 PO | 支持必修、限定选修、自由选修、论文、实习和附加要求 |
| `AcademicSource` | 带明确 scope | 区分最后核对与最后人工核实 |
| `RuleVerificationStatus` | 规则与来源共有 | `verified / tentative / needs_review / unverified / conflict` |

`RequirementGroup.programmeTrackIds` 为空表示适用于该 PO 的全部方向；非空时表示专业方向特定规则。不同专业或 PO 拥有独立的要求组，因此不会套用统一学分模板。

## 3. PO 选择不变量

1. Programme 和 PO 通过双向引用建立明确关系。
2. `entrySemester` 只缩小候选集合；候选可能为零、一个或多个。
3. 系统不按数组顺序、发布日期或“最新”标签自动选中 PO。
4. 保存 scoped profile 必须包含 `poConfirmedByUser: true`。
5. 用户改变学位、学院、专业或入学学期后，界面立即清空先前 PO 确认。
6. 未核实专业可保存 General Mode，并继续使用资源导航及后续个人计划；规则结论保持 unknown。

## 4. 引用完整性

`academicDataPackageSchema` 拒绝：

- 任一实体集合内或跨集合重复 ID；
- Programme 指向其他专业的 Track 或 PO；
- PO、Track、ModuleVersion、RequirementGroup 的悬空来源；
- ModuleVersion 指向不存在的 Module/PO；
- RequirementGroup 指向其他 PO 的父组或不适用方向；
- Source scope 中不存在的 Faculty、Programme、Track、PO 或 ModuleVersion；
- 最小学分大于最大学分、非法 HTTPS 来源或反向有效期范围。

所有正式的 Track、PO、ModuleVersion 和 RequirementGroup 都必须至少引用一个 AcademicSource。Schema 合法仅代表结构合格，不代表学术内容真实；`verified` 仍须按数据政策完成人工复核。

## 5. 本地存储

公共学术数据是只读构建资产。用户的 General Mode 或已确认 Programme/PO 组合写入浏览器 IndexedDB：

```text
database: fau-study-navigator
object store: academic-profile
key: current
```

存储前再次执行 Zod 校验；读取到损坏或未知结构时返回空状态。数据不会写回公共 JSON，也不会进入 URL、外链或远程服务。

## 6. 测试数据隔离

版本重叠、跨专业错误、方向附加要求和同模块多版本测试只使用 `synthetic-test-only-*` fixture。静态门禁断言这些标识不会出现在生产学术 JSON 数据包中。
