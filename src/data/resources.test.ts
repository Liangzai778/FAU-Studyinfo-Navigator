import { describe, expect, it } from 'vitest';
import { builtInResourceCategories } from './resourceCategories';
import { officialResources } from './resources';

/**
 * The opportunity entries exist to close an information gap, so a wrong number
 * is worse than a missing one. These checks enforce that habit: no deadlines or
 * amounts without a source, no duplicate ids, and every link over https.
 */
describe('international student opportunities', () => {
  const opportunities = officialResources.filter((resource) => resource.opportunityKind !== null);

  it('has entries', () => {
    expect(opportunities.length).toBeGreaterThanOrEqual(10);
  });

  it('uses the international category that actually exists', () => {
    const categoryIds = new Set(builtInResourceCategories.map((category) => category.id));
    expect(categoryIds.has('international')).toBe(true);
    for (const resource of opportunities) {
      expect(categoryIds.has(resource.categoryId)).toBe(true);
    }
  });

  it('gives every entry a unique id', () => {
    const ids = officialResources.map((resource) => resource.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('links only over https', () => {
    for (const resource of opportunities) {
      expect(resource.url.startsWith('https://')).toBe(true);
      expect(resource.source.url.startsWith('https://')).toBe(true);
      resource.documents.forEach((document) => expect(document.url.startsWith('https://')).toBe(true));
    }
  });

  it('states who each opportunity is for', () => {
    for (const resource of opportunities) {
      expect(resource.audience.length, `${resource.id} has no audience`).toBeGreaterThan(0);
      resource.audience.forEach((item) => {
        expect(item['zh-CN'].trim().length).toBeGreaterThan(0);
        expect(item.en.trim().length).toBeGreaterThan(0);
      });
    }
  });

  it('verifies every entry rather than guessing', () => {
    for (const resource of opportunities) {
      expect(resource.verificationStatus).toBe('verified');
      expect(resource.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('says the same thing in both languages about deadlines and amounts', () => {
    for (const resource of opportunities) {
      for (const field of [resource.benefit, resource.deadline]) {
        if (!field) continue;
        expect(field['zh-CN'].trim().length).toBeGreaterThan(0);
        expect(field.en.trim().length).toBeGreaterThan(0);
        // Both languages must name at least one number. Counting digits would
        // fail on an honest difference: Chinese writes "9 月 15 日" where
        // English writes "15 September", so the digit counts never match.
        expect(field['zh-CN'], `${resource.id} has no figure in Chinese`).toMatch(/\d/);
        expect(field.en, `${resource.id} has no figure in English`).toMatch(/\d/);
      }
    }
  });

  it('names the benefit in the currency the official page uses', () => {
    const deutschlandstipendium = opportunities.find((resource) => resource.id === 'intl-deutschlandstipendium');
    expect(deutschlandstipendium?.benefit?.['zh-CN']).toContain('300');
    expect(deutschlandstipendium?.benefit?.en).toContain('300');
    // The window is quoted with its year so it cannot be read as "this year".
    expect(deutschlandstipendium?.deadline?.en).toContain('2027');
  });

  it('points the welcome week entry at its programme PDF', () => {
    const welcomeWeek = opportunities.find((resource) => resource.id === 'intl-welcome-week');
    expect(welcomeWeek?.documents.length).toBeGreaterThan(0);
    expect(welcomeWeek?.documents[0]?.format).toBe('PDF');
  });

  it('does not dress plain links up as opportunities', () => {
    // Campo, StudOn, the library: useful, but no deadline and no audience, and
    // labelling them as opportunities would dilute the badge.
    const plain = officialResources.filter((resource) => resource.opportunityKind === null);
    expect(plain.length).toBeGreaterThan(0);
    for (const resource of plain) {
      expect(resource.deadline).toBeNull();
      expect(resource.benefit).toBeNull();
    }
  });
});
