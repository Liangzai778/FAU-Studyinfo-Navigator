# Adding your faculty's programmes

This guide is for the main contribution this project needs: transcribing the
study requirements of a faculty that is not covered yet.

The app is built so that adding data is enough. Nothing in the UI is
hard-coded to biology:

- the dashboard coverage section is derived from the data package,
- a faculty with no programmes shows an explicit "not entered yet" card,
- the moment a programme has a PO with requirement groups, the Degree page
  renders it and the coverage badge flips to *已录入 / Included*.

You do not need to touch React components. You do need to read official
documents carefully.

---

## 0. Choose a scope you can finish

Start with **one programme** and its current PO. A single programme with a
correct module table is worth more than five programmes with guessed modules.

The five faculties already exist in the data model (`phil`, `wiso`, `med`,
`nat`, `tech`), so you do not need a schema change to start.

## 1. Collect the official documents

You need, in this order:

1. **The examination regulation (Prüfungsordnung, PO)** — the legally binding
   document. Find it through the faculty's study pages or the FAU regulation
   index. Note the exact version and amendment date.
2. **The module handbook (Modulhandbuch)** — module names, ECTS, examination
   form, offering terms.
3. **The faculty's programme index** — to know how many programmes exist. Record
   that page as a source even though it is not a rule.

Save the PDFs. Do not transcribe from memory or from a third-party summary.

## 2. Register every source

Every ID you use later must exist in `academicSources`:

```json
{
  "id": "fau-fpo-physik-2025",
  "title": { "zh-CN": "物理学硕士考试条例", "en": "Examination regulations, Physics M.Sc." },
  "publisher": "Friedrich-Alexander-Universität Erlangen-Nürnberg",
  "url": "https://www.fau.de/.../fpo-physik-2025.pdf",
  "documentType": "examination_regulation",
  "scope": { "programmeIds": ["nat-physik-msc"], "examinationRegulationVersionIds": ["po-physik-2025"] },
  "documentVersion": "2025-08-01",
  "sectionOrPage": null,
  "lastCheckedAt": "2026-10-24",
  "lastVerifiedAt": null,
  "verificationStatus": "needs_review",
  "notes": { "zh-CN": "仅登记，尚未逐条录入。", "en": "Registered only; not transcribed yet." }
}
```

Rules:

- `url` must be `https://`.
- `lastVerifiedAt` stays `null` until a human checked the transcription.
- Use `documentType: "module_handbook"` for handbooks; its SHA-256 can go in
  `notes` or `documentVersion` (see the ILS source for the pattern).

## 3. Add the programme

```json
{
  "id": "nat-physik-msc",
  "facultyId": "nat",
  "degreeType": "master",
  "name": { "zh-CN": "物理学（硕士）", "en": "Physics (M.Sc.)" },
  "programmeTrackIds": [],
  "examinationRegulationVersionIds": ["po-physik-2025"],
  "dataStatus": "partial",
  "websiteSourceIds": ["fau-physik-programme-site"]
}
```

`dataStatus` is your own honest assessment: `verified` only when the whole
programme is transcribed and checked; `partial` while the module table is still
incomplete.

### Tracks (optional)

Only add a track if the regulation really offers alternative study profiles, and
a module belongs to one of them:

```json
{
  "id": "physik-track-experimental",
  "programmeId": "nat-physik-msc",
  "name": { "zh-CN": "实验物理方向", "en": "Experimental physics track" },
  "sourceIds": ["fau-fpo-physik-2025"],
  "verificationStatus": "needs_review"
}
```

A requirement group that belongs to a track must list it in
`programmeTrackIds`, otherwise a student choosing the other track sees the wrong
modules. This was a real bug in the ILS data.

## 4. Add the PO version(s)

```json
{
  "id": "po-physik-2025",
  "programmeId": "nat-physik-msc",
  "code": "FPO Physik 2025",
  "title": { "zh-CN": "物理学硕士考试条例（2025）", "en": "Physics M.Sc. examination regulations (2025)" },
  "entrySemesterFrom": "2025-winter",
  "entrySemesterUntil": null,
  "applicabilityNotes": {
    "zh-CN": "适用于 2025 冬季学期及以后入学的学生。",
    "en": "Applies to students enrolled from winter semester 2025 onwards."
  },
  "sourceIds": ["fau-fpo-physik-2025"],
  "verificationStatus": "needs_review"
}
```

- Entry semesters use the format `YYYY-summer` / `YYYY-winter`.
- If an older PO still applies to students who enrolled earlier, add it as a
  separate record. **Never silently replace an old PO with the newest one.**
- A PO with no requirement groups is allowed and is shown honestly as "this
  version has no module table transcribed here". That is better than omitting
  the version, which would make those students match nothing.

## 5. Add modules and module versions

Keep them separate: `module` is the identity, `moduleVersion` is what the
regulation says in a given PO.

```json
{
  "id": "physik-mod-exp1",
  "programmeIds": ["nat-physik-msc"],
  "name": { "zh-CN": "实验物理 I", "en": "Experimental Physics I" }
}
```

```json
{
  "id": "physik-mod-exp1-v2025",
  "moduleId": "physik-mod-exp1",
  "versionLabel": "FPO Physik 2025, p. 12",
  "validFromSemester": "2025-winter",
  "validUntilSemester": null,
  "applicablePoVersionIds": ["po-physik-2025"],
  "ects": 10,
  "offeringTerms": ["winter"],
  "sourceIds": ["fau-fpo-physik-2025"],
  "verificationStatus": "needs_review"
}
```

- `ects` stays `null` when the document does not state it. A required module
  with `null` ECTS will block the graduation calculation — that is intentional
  and visible, not a crash.
- `offeringTerms` comes from the module handbook's "frequency" field. If the
  handbook does not say, use `null`, not a guess.

## 6. Build the requirement group tree

This is the part students actually read. Mirror the regulation's structure:

```json
{
  "id": "rg-physik-gesamt",
  "examinationRegulationVersionId": "po-physik-2025",
  "programmeTrackIds": [],
  "parentRequirementGroupId": null,
  "name": { "zh-CN": "硕士总学分", "en": "Master total" },
  "kind": "mandatory",
  "ruleText": {
    "zh-CN": "总计 120 ECTS，其中必修 60 ECTS、选修 30 ECTS、硕士论文 30 ECTS。",
    "en": "120 ECTS total: 60 mandatory, 30 elective, 30 master's thesis."
  },
  "minEcts": 120,
  "maxEcts": 120,
  "eligibleModuleVersionIds": [],
  "exclusiveCounting": false,
  "sourceIds": ["fau-fpo-physik-2025"],
  "verificationStatus": "needs_review"
}
```

A child group points at its parent:

```json
{
  "id": "rg-physik-pflicht",
  "examinationRegulationVersionId": "po-physik-2025",
  "parentRequirementGroupId": "rg-physik-gesamt",
  "name": { "zh-CN": "必修模块", "en": "Mandatory modules" },
  "kind": "mandatory",
  "ruleText": { "zh-CN": "以下模块全部必修。", "en": "All modules below are mandatory." },
  "minEcts": 60,
  "maxEcts": 60,
  "eligibleModuleVersionIds": ["physik-mod-exp1-v2025", "..."],
  "exclusiveCounting": false,
  "sourceIds": ["fau-fpo-physik-2025"],
  "verificationStatus": "needs_review"
}
```

Notes that come from real mistakes made in this repo:

- **Children of a root must be able to reach the root minimum.**
  `npm run test:data` checks `sum(child.minEcts) === root.minEcts` and
  `sum(child.maxEcts) >= root.maxEcts`. For elective catalogues the upper bound
  may exceed the requirement; that is allowed.
- **`exclusiveCounting`** prevents one module from counting in two groups.
  Enable it where the regulation says a module may only be used once.
- **Rule text is not optional.** A bare module list without the rule sentence
  leaves the student unable to check whether they read it correctly.
- **Do not duplicate a module in both a parent and a child.** The UI hides
  duplicates, but the data should not rely on that.

## 7. Fill in the release metadata

- Bump `dataReleaseId` (for example `2026-10-24.1` → `2026-11-01.1`).
- Add or adjust the numbers in `src/data/coverage.test.ts` if you added
  programmes; the test pins the currently known coverage.

## 8. Run the gates

```bash
npm run test:data
npm run test
npm run typecheck
npm run build
```

`test:data` reports reference integrity, PO ranges, ECTS arithmetic and the
per-group core ECTS checks. A failure names the exact group or ID.

## 9. Open the pull request

Use the pull request template. In the description, state:

- which faculty and programme you added,
- which documents you used (links + version dates),
- what you did **not** transcribe,
- what you checked by hand, and on which page.

Partial work is welcome as long as it is labelled honestly.

---

## Checklist

- [ ] Every source has an HTTPS URL, publisher, document type and check date.
- [ ] Programme has `facultyId`, `degreeType`, PO IDs and `dataStatus`.
- [ ] PO declares its entry-semester range and applicability notes.
- [ ] Modules and module versions exist separately; unknown ECTS are `null`.
- [ ] Requirement groups mirror the regulation, with rule text and sources.
- [ ] Track-scoped groups list their tracks.
- [ ] `dataReleaseId` bumped.
- [ ] `npm run test:data`, `npm run test`, `npm run typecheck`, `npm run build`
      pass.
- [ ] Nothing was guessed.

## Where to look for a worked example

The three biology programmes in `src/data/academic/academic-data.json` are the
reference implementation. The ILS entry is the most complete: 32 modules,
three tracks, a module handbook with a recorded SHA-256, and 35 assertions that
tie each module to its handbook page.
