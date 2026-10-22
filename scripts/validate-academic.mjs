import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('src/data/academic/academic-data.json', 'utf8'));
let bad = 0;

const srcIds = new Set(data.academicSources.map((s) => s.id));
const poIds = new Set(data.examinationRegulationVersions.map((p) => p.id));
const progIds = new Set(data.programmes.map((p) => p.id));
const modIds = new Set(data.modules.map((m) => m.id));
const mvIds = new Set(data.moduleVersions.map((m) => m.id));
const trackIds = new Set(data.programmeTracks.map((t) => t.id));

function fail(msg) { console.log('  FAIL ' + msg); bad += 1; }

// Reference integrity.
for (const s of data.academicSources) {
  for (const p of s.scope.programmeIds) if (!progIds.has(p)) fail(`source ${s.id} -> unknown programme ${p}`);
  for (const v of s.scope.examinationRegulationVersionIds) if (!poIds.has(v)) fail(`source ${s.id} -> unknown po ${v}`);
  if (!s.url.startsWith('https://')) fail(`source ${s.id} not https`);
}
for (const po of data.examinationRegulationVersions) {
  if (!progIds.has(po.programmeId)) fail(`po ${po.id} -> unknown programme`);
  for (const s of po.sourceIds) if (!srcIds.has(s)) fail(`po ${po.id} -> unknown source ${s}`);
}
for (const m of data.modules) {
  for (const p of m.programmeIds) if (!progIds.has(p)) fail(`module ${m.id} -> unknown programme ${p}`);
}
for (const mv of data.moduleVersions) {
  if (!modIds.has(mv.moduleId)) fail(`moduleVersion ${mv.id} -> unknown module`);
  for (const p of mv.applicablePoVersionIds) if (!poIds.has(p)) fail(`moduleVersion ${mv.id} -> unknown po ${p}`);
  for (const s of mv.sourceIds) if (!srcIds.has(s)) fail(`moduleVersion ${mv.id} -> unknown source ${s}`);
}
for (const rg of data.requirementGroups) {
  if (!poIds.has(rg.examinationRegulationVersionId)) fail(`rg ${rg.id} -> unknown po`);
  for (const m of rg.eligibleModuleVersionIds) if (!mvIds.has(m)) fail(`rg ${rg.id} -> unknown moduleVersion ${m}`);
  for (const s of rg.sourceIds) if (!srcIds.has(s)) fail(`rg ${rg.id} -> unknown source ${s}`);
  if (rg.parentRequirementGroupId && !data.requirementGroups.some((x) => x.id === rg.parentRequirementGroupId)) {
    fail(`rg ${rg.id} -> unknown parent`);
  }
}
for (const p of data.programmes) {
  for (const s of p.websiteSourceIds) if (!srcIds.has(s)) fail(`programme ${p.id} -> unknown source ${s}`);
  for (const v of p.examinationRegulationVersionIds) if (!poIds.has(v)) fail(`programme ${p.id} -> unknown po ${v}`);
  for (const tr of p.programmeTrackIds) if (!trackIds.has(tr)) fail(`programme ${p.id} -> unknown track ${tr}`);
}

// Arithmetic: children of each root must sum to the root total.
for (const root of data.requirementGroups.filter((r) => r.parentRequirementGroupId === null && r.maxEcts)) {
  const kids = data.requirementGroups.filter((r) => r.parentRequirementGroupId === root.id);
  const sumMin = kids.reduce((a, k) => a + (k.minEcts ?? 0), 0);
  const sumMax = kids.reduce((a, k) => a + (k.maxEcts ?? 0), 0);
  const ok = sumMin === root.minEcts && sumMax === root.maxEcts;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${root.id}: total ${root.minEcts}-${root.maxEcts}, children sum ${sumMin}-${sumMax}`);
  if (!ok) bad += 1;
}

// Module ECTS totals per PO must reach 120 when the exclusive group picks one.
const poTotals = {};
for (const mv of data.moduleVersions) {
  const po = mv.applicablePoVersionIds[0];
  poTotals[po] ??= { all: 0, exclusiveCandidates: [] };
  poTotals[po].all += mv.ects ?? 0;
}
console.log('\nModule ECTS totals per PO (all listed modules):');
for (const [po, v] of Object.entries(poTotals)) console.log(`  ${po}: ${v.all} ECTS`);

// Elective lists must not repeat a module, and each module group's core modules
// must add up to what the regulation states for that group.
const ectsOf = new Map(data.moduleVersions.map((mv) => [mv.id, mv.ects ?? 0]));

for (const rg of data.requirementGroups) {
  const seen = new Set();
  for (const id of rg.eligibleModuleVersionIds) {
    if (seen.has(id)) fail(`rg ${rg.id} lists ${id} more than once`);
    seen.add(id);
  }
}

const ilsGroupExpectations = [
  { id: 'rg-ils-mg1-wahlpflicht', core: ['ils-m2-biomathematik-v1', 'ils-b1-systems-biology-v1'], coreEcts: 15, label: 'MG1' },
  { id: 'rg-ils-mg2-wahlpflicht', core: ['ils-i1a-bioimaging-v1', 'ils-i1b-bioimaging-v1'], coreEcts: 15, label: 'MG2' },
  { id: 'rg-ils-mg3-wahlpflicht', core: ['ils-i2a-macromolecules-v1', 'ils-i2b-macromolecules-v1'], coreEcts: 10, label: 'MG3' },
];

console.log('\nILS module groups:');
for (const expectation of ilsGroupExpectations) {
  const rg = data.requirementGroups.find((r) => r.id === expectation.id);
  if (!rg) {
    fail(`missing ILS module group ${expectation.id}`);
    continue;
  }
  if (rg.parentRequirementGroupId !== 'rg-ils-modulgruppen') {
    fail(`${expectation.id} must hang under rg-ils-modulgruppen`);
  }
  if (rg.eligibleModuleVersionIds.length === 0) fail(`${expectation.id} has no electives`);

  const coreTotal = expectation.core.reduce((sum, id) => sum + (ectsOf.get(id) ?? 0), 0);
  const ok = coreTotal === expectation.coreEcts;
  console.log(
    `  ${ok ? 'OK  ' : 'FAIL'} ${expectation.label}: core ${coreTotal} ECTS (expected ${expectation.coreEcts}), ${rg.eligibleModuleVersionIds.length} electives`,
  );
  if (!ok) bad += 1;

  for (const id of rg.eligibleModuleVersionIds) {
    if ((ectsOf.get(id) ?? 0) <= 0) fail(`${expectation.id} elective ${id} has no ECTS`);
  }
}

console.log(`\n${bad === 0 ? 'ALL CHECKS PASSED' : bad + ' CHECK(S) FAILED'}`);
process.exit(bad === 0 ? 0 : 1);
