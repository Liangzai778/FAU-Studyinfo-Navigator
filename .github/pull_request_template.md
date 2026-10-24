## What changed

<!-- One or two sentences. What was wrong, what does it do now? -->

## Why

<!-- The reason, not the diff. Link the issue if there is one. -->

## Verification

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run test:data` (required for any academic-data change)
- [ ] `npm run build`
- [ ] `npm run test:e2e` (if UI behaviour changed)

<!-- Paste the test counts or the failing-before/passing-after evidence. -->

## If this changes academic data

- Programme and PO:
- Official documents used (link + version date):
- Pages checked by hand:
- What is still **not** transcribed:

## Anything a reviewer should be suspicious of

<!-- Optional, but honest. "The 2019 PO still has no module table" belongs here. -->

## Checklist

- [ ] New user-visible strings exist in both `zh-CN` and `en`.
- [ ] No personal data or credentials committed.
- [ ] No guessed academic value; unverified things stay marked as such.
- [ ] `dataReleaseId` bumped if the data package changed.
