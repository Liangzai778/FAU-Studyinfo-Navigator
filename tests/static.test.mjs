import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import test from 'node:test';

const requiredFiles = [
  'AGENTS.md',
  'upload/PRD(1).md',
  'src/main.tsx',
  'src/app/router.tsx',
  'src/styles.css',
  'src/i18n/messages.ts',
  'src/store/preferences.ts',
  'src/store/resourceNavigator.ts',
  'src/domain/resources.ts',
  'src/domain/academic.ts',
  'src/domain/academicMatching.ts',
  'src/data/academic/academic-data.json',
  'src/data/academicData.ts',
  'src/storage/academicProfileStorage.ts',
  'src/storage/database.ts',
  'src/storage/plannerStorage.ts',
  'src/store/academicProfile.ts',
  'src/store/planner.ts',
  'src/domain/planner.ts',
  'src/domain/ectsEngine.ts',
  'src/domain/exams.ts',
  'src/domain/berlinDateTime.ts',
  'src/domain/calendarExport.ts',
  'src/data/officialAcademicDates.ts',
  'src/storage/examsTasksStorage.ts',
  'src/storage/backup.ts',
  'src/storage/clearLocalData.ts',
  'src/store/examsTasks.ts',
  'src/features/exams/ExamsPage.tsx',
  'src/features/resources/ResourcesPage.tsx',
  'README.md',
  'playwright.config.ts',
  'tests/e2e/smoke.spec.ts',
];

test('keeps the P1 deliverables and the original PRD', async () => {
  await Promise.all(requiredFiles.map((file) => stat(file)));
});

test('declares all six requested routes', async () => {
  const router = await readFile('src/app/router.tsx', 'utf8');
  for (const path of ['degree', 'planner', 'exams', 'resources', 'settings']) {
    assert.match(router, new RegExp(`path="${path}"`));
  }
  assert.match(router, /Route index element={<DashboardPage \/>}/);
});

test('uses a local-only content security policy', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src 'self'/);
  assert.doesNotMatch(html, /<(script|link)[^>]+(?:src|href)="https?:\/\//i);
});

test('contains no background networking implementation', async () => {
  const files = await collectSourceFiles('src');
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(source, /\bWebSocket\s*\(/);
  assert.doesNotMatch(source, /\baxios\b/);
});

test('uses no cookies, beacons or tracking scripts', async () => {
  const files = await collectSourceFiles('src');
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /document\.cookie/);
  assert.doesNotMatch(source, /navigator\.sendBeacon/);
  assert.doesNotMatch(source, /\bgtag\b|\bdataLayer\b|\bplausible\b|\bmatomo\b|google-analytics/i);
});

test('keeps the contributor guides discoverable from each other', async () => {
  const english = await readFile('docs/ADDING_A_FACULTY.md', 'utf8');
  const chinese = await readFile('docs/ADDING_A_FACULTY.zh-CN.md', 'utf8');
  const index = await readFile('docs/README.md', 'utf8');
  const readme = await readFile('README.md', 'utf8');
  const contributing = await readFile('CONTRIBUTING.md', 'utf8');

  assert.ok(english.includes('ADDING_A_FACULTY.zh-CN.md'), 'the English guide must link the Chinese one');
  assert.ok(chinese.includes('ADDING_A_FACULTY.md'), 'the Chinese guide must link the English one');
  assert.ok(index.includes('ADDING_A_FACULTY.zh-CN.md'), 'the docs index must list the Chinese guide');
  assert.ok(readme.includes('ADDING_A_FACULTY.zh-CN.md'), 'the README must point at the Chinese guide');
  assert.ok(contributing.includes('ADDING_A_FACULTY.zh-CN.md'), 'CONTRIBUTING must point at the Chinese guide');

  for (const section of ['30 秒看懂', '报错对照表', '字段速查', '常见问题']) {
    assert.ok(chinese.includes(section), `the Chinese guide must keep the "${section}" section`);
  }
});

test('declares the non-commercial legal notice in both the repo and the app', async () => {
  const legal = await readFile('LEGAL.md', 'utf8');
  for (const term of ['DSGVO', 'BDSG', 'TDDDG', 'UrhG', 'nicht-kommerziell', 'Kein Scraping']) {
    assert.ok(legal.includes(term), `LEGAL.md must mention ${term}`);
  }

  const router = await readFile('src/app/router.tsx', 'utf8');
  assert.match(router, /path="legal"/);

  const shell = await readFile('src/components/layout/AppShell.tsx', 'utf8');
  assert.match(shell, /to="\/legal"/);

  const messages = await readFile('src/i18n/messages.ts', 'utf8');
  assert.match(messages, /'legal\.privacyTitle'/);
  assert.match(messages, /'legal\.nonCommercialTitle'/);
});

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

test('defaults to Simplified Chinese', async () => {
  const store = await readFile('src/store/preferences.ts', 'utf8');
  assert.match(store, /language: 'zh-CN'/);
});

test('declares the required local application stack', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  for (const dependency of ['react', 'react-dom', 'react-router-dom', 'zod', 'zustand']) {
    assert.ok(packageJson.dependencies[dependency], `${dependency} is missing`);
  }
  for (const dependency of ['vite', 'typescript', 'tailwindcss', 'vitest']) {
    assert.ok(packageJson.devDependencies[dependency], `${dependency} is missing`);
  }
});

test('keeps Chinese and English message key sets aligned', async () => {
  const source = await readFile('src/i18n/messages.ts', 'utf8');
  const chineseBlock = source.match(/export const zhCN = \{([\s\S]*?)\n\} as const;/)?.[1] ?? '';
  const englishBlock = source.match(/export const en:[^{]+\{([\s\S]*?)\n\};/)?.[1] ?? '';
  const keys = (block) => [...block.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]).sort();
  assert.deepEqual(keys(englishBlock), keys(chineseBlock));
  assert.ok(keys(chineseBlock).length > 50);
});

test('defines every translation key used by the interface', async () => {
  const files = await collectSourceFiles('src');
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  const messages = await readFile('src/i18n/messages.ts', 'utf8');
  const defined = new Set([...messages.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]));
  const used = [...source.matchAll(/\bt\('([^']+)'\)/g)].map((match) => match[1]);
  const missing = [...new Set(used.filter((key) => !defined.has(key)))];
  assert.deepEqual(missing, []);
});

test('contains exactly the five documented FAU faculty identifiers', async () => {
  const data = JSON.parse(await readFile('src/data/academic/academic-data.json', 'utf8'));
  const ids = data.faculties.map((faculty) => faculty.id);
  assert.deepEqual(ids.sort(), ['med', 'nat', 'phil', 'tech', 'wiso']);
});

test('does not hard-code numeric ECTS claims in the P1 interface', async () => {
  const source = await readFile('src/i18n/messages.ts', 'utf8');
  assert.doesNotMatch(source, /\b\d+(?:[.,]\d+)?\s*ECTS\b/i);
});

test('models P2 resource provenance, applicability, and local persistence', async () => {
  const schema = await readFile('src/domain/resources.ts', 'utf8');
  const store = await readFile('src/store/resourceNavigator.ts', 'utf8');
  const data = await readFile('src/data/resources.ts', 'utf8');
  for (const field of ['facultyIds', 'degreeTypes', 'source', 'lastCheckedAt', 'verificationStatus']) {
    assert.match(schema, new RegExp(`${field}:`));
  }
  assert.match(store, /fau-study-navigator\.resources\.v1/);
  assert.match(store, /toggleFavorite/);
  assert.match(store, /addCustomResource/);
  assert.match(store, /addCustomCategory/);
  assert.ok([...data.matchAll(/^\s+id: '/gm)].length >= 10);
});

test('models P3 academic entities, PO confirmation, and local JSON data', async () => {
  const schema = await readFile('src/domain/academic.ts', 'utf8');
  const data = JSON.parse(await readFile('src/data/academic/academic-data.json', 'utf8'));
  const page = await readFile('src/features/degree/DegreePage.tsx', 'utf8');
  const storage = await readFile('src/storage/academicProfileStorage.ts', 'utf8');
  const database = await readFile('src/storage/database.ts', 'utf8');
  for (const entity of [
    'facultySchema',
    'degreeTypeSchema',
    'programmeSchema',
    'programmeTrackSchema',
    'entrySemesterSchema',
    'examinationRegulationVersionSchema',
    'moduleSchema',
    'moduleVersionSchema',
    'requirementGroupSchema',
    'academicSourceSchema',
    'ruleVerificationStatusSchema',
  ]) {
    assert.match(schema, new RegExp(`export const ${entity}`));
  }
  assert.equal(data.faculties.length, 5);
  assert.ok(Array.isArray(data.programmes));
  assert.ok(Array.isArray(data.examinationRegulationVersions));
  assert.ok(Array.isArray(data.modules));
  assert.ok(Array.isArray(data.requirementGroups));
  // Programme entries must stay traceable. Verified status is allowed only when
  // the entry points at sources and regulation versions that actually exist,
  // so nothing can be marked verified without something to verify it against.
  const facultyIds = new Set(data.faculties.map((faculty) => faculty.id));
  const sourceIds = new Set(data.academicSources.map((source) => source.id));
  const poVersionIds = new Set(data.examinationRegulationVersions.map((po) => po.id));
  for (const programme of data.programmes) {
    assert.ok(facultyIds.has(programme.facultyId), `unknown facultyId ${programme.facultyId}`);
    for (const sourceId of programme.websiteSourceIds) {
      assert.ok(sourceIds.has(sourceId), `${programme.id} links unknown source ${sourceId}`);
    }
    for (const poId of programme.examinationRegulationVersionIds) {
      assert.ok(poVersionIds.has(poId), `${programme.id} references unknown regulation ${poId}`);
    }
    if (programme.dataStatus === 'verified') {
      assert.ok(
        programme.websiteSourceIds.length > 0,
        `${programme.id} claims verified status with no source links`,
      );
      assert.ok(
        programme.examinationRegulationVersionIds.length > 0,
        `${programme.id} claims verified status with no regulation version`,
      );
    }
  }
  // Requirement groups that claim to be verified must cite a source, and the
  // modules they list must exist.
  const moduleVersionIds = new Set(data.moduleVersions.map((version) => version.id));
  for (const group of data.requirementGroups) {
    assert.ok(group.sourceIds.length >= 1, `${group.id} has no source`);
    for (const sourceId of group.sourceIds) {
      assert.ok(sourceIds.has(sourceId), `${group.id} references unknown source ${sourceId}`);
    }
    for (const moduleVersionId of group.eligibleModuleVersionIds) {
      assert.ok(moduleVersionIds.has(moduleVersionId), `${group.id} references unknown module version ${moduleVersionId}`);
    }
  }
  for (const source of data.academicSources) {
    assert.ok(source.url.startsWith('https://'), `${source.id} must use HTTPS`);
    for (const programmeId of source.scope.programmeIds) {
      assert.ok(
        data.programmes.some((programme) => programme.id === programmeId),
        `${source.id} references unknown programme ${programmeId}`,
      );
    }
  }
  for (const po of data.examinationRegulationVersions) {
    assert.ok(po.sourceIds.length >= 1, `${po.id} has no source`);
    for (const sourceId of po.sourceIds) {
      assert.ok(sourceIds.has(sourceId), `${po.id} references unknown source ${sourceId}`);
    }
  }
  assert.match(schema, /poConfirmedByUser: z\.literal\(true\)/);
  assert.match(page, /findCandidatePoVersions/);
  assert.match(storage, /openLocalDatabase/);
  assert.match(database, /indexedDB\.open/);
  assert.doesNotMatch(JSON.stringify(data), /synthetic-test-only/);
});

test('models P4 planner states, pure ECTS calculation, and transactional IndexedDB storage', async () => {
  const planner = await readFile('src/domain/planner.ts', 'utf8');
  const engine = await readFile('src/domain/ectsEngine.ts', 'utf8');
  const storage = await readFile('src/storage/plannerStorage.ts', 'utf8');
  const database = await readFile('src/storage/database.ts', 'utf8');
  const page = await readFile('src/features/planner/PlannerPage.tsx', 'utf8');
  for (const status of ['planned', 'in_progress', 'passed', 'failed', 'recognized']) {
    assert.match(planner, new RegExp(`'${status}'`));
  }
  assert.match(engine, /export function calculateEctsProgress/);
  assert.doesNotMatch(engine, /\bReact\b|useState|useEffect|indexedDB/);
  assert.match(engine, /po_mismatch/);
  assert.match(engine, /unconfirmed_recognition/);
  assert.match(engine, /duplicate_course/);
  assert.match(storage, /transaction\(\[plannerCoursesStoreName, plannerAttemptsStoreName\], 'readwrite'\)/);
  assert.match(database, /localDatabaseVersion = 3/);
  assert.match(page, /calculateEctsProgress/);
  assert.match(page, /addRetake/);
});

test('models P5 personal exams, tasks, Berlin time, calendar export, and safe backup restore', async () => {
  const schema = await readFile('src/domain/exams.ts', 'utf8');
  const berlin = await readFile('src/domain/berlinDateTime.ts', 'utf8');
  const calendar = await readFile('src/domain/calendarExport.ts', 'utf8');
  const backup = await readFile('src/storage/backup.ts', 'utf8');
  const database = await readFile('src/storage/database.ts', 'utf8');
  const page = await readFile('src/features/exams/ExamsPage.tsx', 'utf8');
  const settingsPage = await readFile('src/features/settings/SettingsPage.tsx', 'utf8');
  const officialDates = await readFile('src/data/officialAcademicDates.ts', 'utf8');
  for (const status of ['unknown', 'not_registered', 'user_marked_registered', 'attended', 'cancelled']) {
    assert.match(schema, new RegExp(`'${status}'`));
  }
  assert.match(schema, /dateStatus: z\.literal\('user_entered'\)/);
  assert.match(schema, /status: z\.enum\(\['confirmed', 'tentative', 'unknown'\]\)/);
  assert.match(berlin, /Europe\/Berlin/);
  assert.match(calendar, /VTIMEZONE/);
  assert.match(calendar, /X-FAU-SN-ORIGIN:PERSONAL/);
  assert.match(backup, /MAX_BACKUP_BYTES/);
  assert.match(backup, /localBackupSchema\.parse/);
  assert.match(backup, /Conflicting/);
  assert.match(backup, /'readwrite'/);
  assert.match(database, /personal-exams/);
  assert.match(database, /study-tasks/);
  assert.match(page, /createCalendarIcs/);
  assert.match(settingsPage, /BackupPanel/);
  assert.match(officialDates, /= \[\]/);
});

test('provides P6 local clear and Playwright quality gates', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const settings = await readFile('src/features/settings/SettingsPage.tsx', 'utf8');
  const clearStorage = await readFile('src/storage/clearLocalData.ts', 'utf8');
  assert.equal(packageJson.scripts['test:e2e'], 'playwright test');
  assert.ok(packageJson.devDependencies['@playwright/test']);
  assert.match(settings, /clearAllData/);
  assert.match(settings, /window\.confirm/);
  assert.match(clearStorage, /transaction\(\[\.\.\.personalStoreNames\], 'readwrite'\)/);
});
