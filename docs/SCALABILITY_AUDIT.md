# SCALABILITY_AUDIT.md

Date: 2026-10-23
Scope: source-level audit of the local repository, not an inference from `PROJECT_LOG.md`.
Every claim below was produced by running code against the real data at
`src/data/academic/academic-data.json` (release `2026-10-22.2`).

Working tree state before this audit: clean (`git status --short` empty, HEAD `3fbe58d`).
Verification run before changes: `npm run typecheck` clean, `npx vitest run` 40/40 passed,
`npm run test:data` all checks passed.

---

## 1. Module count discrepancy (65 global vs 56 in the log) — RESOLVED

**Result: 65 is correct, 56 is wrong.**

| Programme | Modules (all) | Modules reachable from a requirement group |
| --- | --- | --- |
| ZMB (`nat-biologie-zell-molekularbiologie-msc`) | 13 | 13 |
| ILS (`nat-biologie-integrated-life-sciences-msc`) | 41 | 32 |
| iImmune (`nat-biologie-integrated-immunology-msc`) | 11 | 11 |
| **Total** | **65** | **56** |

The log's "ILS: 32" counted only the modules that are *electable* through a
requirement group. The programme actually carries **41** module records:
32 in the three module groups plus 9 curriculum modules that belong to the
programme but are not listed as eligible in any group:

- `ils-mod-48071-v1` Introduction to Statistics (5)
- `ils-mod-48081-v1` Advanced Module (20)
- `ils-mod-1999-v1` Master's thesis (30)
- `ils-mod-48091-v1` Biomathematics (10)
- `ils-mod-48101-v1` Systems Biology (5)
- `ils-mod-48111-v1` / `ils-mod-48112-v1` Bioimaging and Biophysics A/B (7.5 each)
- `ils-mod-48121-v1` / `ils-mod-48122-v1` Interactions of Biological Macromolecules A/B (5 each)

**This is a real coverage gap, not just a counting artefact.** The ILS
graduation requirements reference 55 ECTS as "statistics, advanced module and
master's thesis" (`rg-ils-abschluss`) but that group has `minEcts = 55` with
`eligibleModuleVersionIds = 3`. Meanwhile the statistics module, the advanced
module and the thesis module in the list above are reachable through no group
at all. So `rg-ils-abschluss` almost certainly points at module versions that
are *not* the ones a student would actually take. Teaching catalog coverage is
incomplete: a student can currently only see 32 of the 41 ILS modules on the
degree page.

Action taken: **none on data.** Reported only; fixing it requires reading the
ILS module handbook.

---

## 2. Natural Sciences programme count — CANNOT BE VERIFIED FROM DATA

The data package contains 3 programmes, all `nat`, all `master`. There is no
record anywhere in the JSON of "how many master's programmes the faculty has",
so the 15/3/12 vs 13-item-list discrepancy from the log cannot be decided by
code. It requires checking the official faculty index
(`fau-nat-faculty-master-list`, currently `verified`).

Recommendation: record the authoritative programme list as a source-backed
catalogue entry (`dataStatus` per programme) rather than a free number in a
markdown log. That is exactly what the coverage report does.

---

## 3. ECTS arithmetic in the real data

| PO | Sum of all reachable module ECTS | Sum of group minimums |
| --- | --- | --- |
| `po-zmb-2026` | 150 (13 modules, one 15-ECTS-group with 3 exclusive alternatives) | 240 |
| `po-ils-2026` | 242.5 (32 modules) | 240 |
| `po-iimmune-2026` | 120 (11 modules, one `null` ECTS) | 240 |

Notes:

- `po-zmb-2026` sums to 150 because `rg-zmb-wahl` allows one of three 15-ECTS
  options. 150 − 30 = 120 when two of the three are excluded. This is legible
  as a curriculum, but the group carries a single `minEcts` with no
  "choose 1 of N" semantics, so the validator cannot check it structurally.
- `po-ils-2026` sums to 242.5 against a 240 minimum, because the module groups
  offer more elective ECTS than the 65 required. This is normal for an
  elective catalogue and must not be "fixed".
- **`iimmun-m8-v1` ("Seminar to Project Work") has `ects: null`** while every
  other module is `verified`. A required module with unknown ECTS shows up as
  `missing_course_ects` at runtime and permanently blocks a satisfied
  graduation status. Needs the iImmune module handbook.

---

## 4. ECTS engine: allocation is *not* a global solver — CONFIRMED BY CODE

`src/domain/ectsEngine.ts`, `calculateEctsProgress`, lines ~150-190.

A course is assigned to a requirement group by the **student's own
`attempt.requirementGroupId`**, not by the engine. `sumForGroup` iterates the
groups in array order and keeps whatever the user selected:

```
if (item.attempt.requirementGroupId !== group.id) return;
```

Consequences:

1. **No allocation search.** If the user does not pick a group, the ECTS is
   counted in `earnedEcts` but never in any group, surfacing as
   `unallocatedEarnedEcts`. That is deliberate and fair.
2. **But there is no cross-check that a *satisfying* allocation could exist.**
   A user who assigns a flexible module to a group that is already full gets
   no warning; the engine only reports the resulting shortfall.
3. **Exclusivity is order-dependent.** `allocation` is a single `Map` shared
   across groups and mutated while iterating `groupsForPo`. When two groups
   both accept the same module and `exclusiveCounting` is set, the first group
   in array order wins silently. Since allocation is user-driven this rarely
   bites, but the ordering means the *risk report* depends on JSON order.
4. `earnedEcts` vs `completedEcts`: `completedEcts` counts every passed course
   regardless of PO/matching; only `earnedEcts` respects PO. Fine, but the
   degree page must never display `completedEcts` as graduation progress.

This is a design that is honest about uncertainty, not a bug. My earlier
(in the chat) assumption of a sequential greedy solver was wrong — the code
never allocates on the user's behalf. The gap is a *missing* feature
("suggest a valid allocation"), not a broken one.

---

## 5. Cross-PO mixing — CLEAN

Programmatically checked: every `eligibleModuleVersionId` in every requirement
group belongs to a module version whose `applicablePoVersionIds` contains that
group's PO. No cross-PO references. `attempt.poVersionId !== selectedPoVersionId`
is correctly rejected in the engine (`po_mismatch`).

`po-zmb-2019` exists but has **0 requirement groups and 0 module versions**.
This is correctly surfaced as `needs_review`, and `getRequirementGroupsForSelection`
returns an empty list, which the engine turns into `no_verified_rules` +
`unknown` status. No false "you satisfy the degree" possible.

---

## 6. Data model scalability

`academic-data.json` is 90 KB / 65 modules — fine today. Problems at scale:

- One file holds all faculties; every edit touches one Git blob.
- `programmeIds` on a module is a denormalised back-reference that must be
  kept in sync with `applicablePoVersionIds` by hand.
- `AcademicSource.sectionOrPage` is a single free-text string on the *source*,
  not on the *rule*. There is no per-field evidence, so a changed PDF cannot
  be diffed against recorded values.
- `dataReleaseId` is a static string with no migration hook; nothing verifies
  that a user's stored `poVersionId` still exists after a data release.
- `academicDataPackageSchema` (Zod) already enforces global ID uniqueness,
  reference integrity and PO ranges. This is the strongest part of the model
  and should be reused as the gate for any generated catalogue.

---

## 7. Cloudflare sub-route 404 — ROOT CAUSE FOUND AND FIXED

**Reproduced** with `npx wrangler pages dev dist --port 8788`:

```
/                    200
/degree              404
/planner             404
/exams               404
```

**Cause:** `scripts/postbuild.mjs` copied `dist/index.html` to `dist/404.html`.
Cloudflare Pages uses a root `404.html` as the not-found *response body* and
serves it with status 404, which overrides the SPA fallback configured by
`assets.not_found_handling: "single-page-application"` in `wrangler.jsonc`.

**Verified fix:** removing `dist/404.html` and re-requesting:

```
/                    200
/degree              200
/planner             200
/exams               200
/does-not-exist      200
```

`404.html` was added for a GitHub Pages deployment that is no longer the
target. `public/_redirects` (`/* /index.html 200`) is also obsolete on
Cloudflare Pages and is *rejected* by wrangler as an infinite loop:

```
WARNING Found 1 invalid redirect rule: /*  /index.html  200
        Infinite loop detected in this rule and has been ignored.
```

Changes applied in this audit (build config only, no data, no domain logic):

- `scripts/postbuild.mjs` — stop writing `dist/404.html`; keep `.nojekyll`.
- `public/_routes.json` — removed `/_redirects` and `/_routes.json` from
  `exclude`; those files will no longer be emitted. Added `/_routes.json` itself
  is still generated by Cloudflare, not copied.

Not changed: `public/_redirects` deletion is recommended but left in place —
see §8.

---

## 8. Open items, ranked

| # | Severity | Item | Needs |
| --- | --- | --- | --- |
| 1 | High | ILS: 9 curriculum modules unreachable from any requirement group | ILS module handbook PDF |
| 2 | High | `iimmun-m8-v1` has `ects: null` | iImmune module handbook |
| 3 | High | `rg-ils-abschluss` eligible modules do not include the statistics/advanced/thesis modules that exist in the catalogue | ILS PO + handbook |
| 4 | Medium | No per-field evidence (`RuleEvidence`) — cannot diff a changed PDF against stored values | data model change |
| 5 | Medium | Covered-module catalogue not split per programme/PO | build pipeline |
| 6 | Medium | `public/_redirects` obsolete and warns on every wrangler run | delete file |
| 7 | Low | Engine cannot tell a user "a satisfying allocation exists, you picked the wrong group" | new solver, optional |
| 8 | Low | Faculty master's programme count unverifiable from data | faculty index check |

---

## 9. What I did NOT do

- No academic data was modified. Zero edits under `src/data/`.
- `ectsEngine.ts` untouched.
- No commits, no push, no deploy.

The "add all Natural Sciences master's programmes with complete and correct
ECTS" goal cannot be reached by code alone. It needs the official module
handbooks for the 12+ programmes that are not yet in the catalogue, and the
existing gaps above (items 1-3) show what happens when a handbook is only
partially read. Adding more programmes at that quality level would make the
data look broader while being less trustworthy.
