# SCALABILITY_AUDIT.md

Date: 2026-10-23
Scope: source-level audit of the local repository, not an inference from `PROJECT_LOG.md`.
Every claim below was produced by running code against the real data at
`src/data/academic/academic-data.json` (release `2026-10-22.2`).

> **Status update 2026-10-24.** Items 1, 3 and 6 below were fixed in `4f3acb1`
> and `d03ff0f`; item 8 was made moot by deriving coverage from data
> (`src/data/coverage.ts`). Items 2, 4, 5 and 7 are still open. See §10 for the
> per-item resolution. The audit body is left as written so the reasoning can
> be checked against the commit that changed it.

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

---

## 10. Resolution status, 2026-10-24

| # | Item | Status | Where |
| --- | --- | --- | --- |
| 1 | ILS: 9 curriculum modules unreachable from any requirement group | **Fixed.** The 9 duplicate catalogue entries were removed (module count 65 → 56) and all 32 ILS modules are now reachable from a group. | `4f3acb1`, `coverage.test.ts` |
| 2 | `iimmun-m8-v1` has `ects: null` | **Open, but narrower than stated.** Deliberately not guessed. The Degree page now shows an "ECTS unconfirmed" badge. Correction: it does **not** permanently block a satisfied status — the other three modules in `rg-iimmun-projekt` add up to exactly 35 ECTS, so the group minimum is reachable without it. | `DegreePage.tsx`, i18n |
| 3 | `rg-ils-abschluss` points at the wrong module versions | **Fixed.** It now references the real statistics / advanced module / thesis versions (5 + 20 + 30 = 55 ECTS against `minEcts` 60 with an elective remainder). | `4f3acb1` |
| 4 | No per-field evidence (`RuleEvidence`) | **Open.** Unchanged. | — |
| 5 | Covered-module catalogue not split per programme/PO | **Partly addressed.** `src/data/coverage.ts` derives per-programme and per-faculty coverage, which is what the UI needed. Per-PO evidence is still missing. | `coverage.ts` |
| 6 | `public/_redirects` obsolete and warns on every wrangler run | **Fixed.** File deleted. | `d03ff0f` |
| 7 | Engine cannot suggest a satisfying allocation | **Open by design.** Documented in §4; the user still assigns groups. | — |
| 8 | Faculty master's programme count unverifiable from data | **Made moot in the UI, still true in the data.** The app no longer claims a total; it reports what is actually entered, per faculty, and marks the rest "not yet". The audit's point stands: a number in a markdown log is not a source. | `coverage.ts`, `README.md` |

Correction to §1: after the dedupe the package has 56 modules, not 65. The
"41 ILS modules, 32 electable" split described there no longer exists; ILS now
carries exactly the 32 modules that its requirement groups reference.

Correction to the release id: the data changed twice after `2026-10-22.2`
(ILS fixes, then the coverage release), so the current release is
`2026-10-24.1`.

### 10.1 Two defects this audit did not catch

Both were found on 2026-10-24 while preparing the open-source release, and both
would have kept every student from ever seeing a satisfying graduation result.

**The threshold contradiction in `rg-ils-abschluss`.** The group's own rule text
said 5 + 20 + 30 = 55 ECTS, but `minEcts` was 60. `rg-ils-modulgruppen` said 65
in its rule text but carried `minEcts: 60`. The two wrong numbers summed to the
correct 120, so the root-total check in `validate-academic.mjs` passed. § 51 (2)
of the FPO BAMA ILS (checked against the PDF on 2026-10-24) states one module
group at 30 ECTS, another at 35, statistics 5, advanced module 20 and thesis 30.
The data now matches: 65 + 55.

`validate-academic.mjs` gained a per-group reachability check (`needs N, offers
M`) so a threshold larger than the modules it governs can no longer hide.

**Parent groups were never credited.** `calculateEctsProgress` summed each
requirement group independently, matching only courses whose
`attempt.requirementGroupId` equalled that group. Every programme's 120-ECTS
root group is a container with no modules of its own, so its earned total was
always 0 and `graduationStatus` could never be `satisfied`. Child credits now
roll up into the parent. Behavioural tests live in
`src/domain/ectsEngine.test.ts`, and `src/data/fullPlan.test.ts` builds a
complete ILS plan from the real data and asserts a satisfied result.

This corrects §4's conclusion in one respect: allocation is still user-driven
and the engine still does not guess, but the result it reports is now the whole
tree, not just the leaves.
