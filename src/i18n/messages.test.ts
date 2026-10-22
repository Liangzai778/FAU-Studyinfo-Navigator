import { describe, expect, it } from 'vitest';
import { en, zhCN } from './messages';

describe('translations', () => {
  it('keeps English and Simplified Chinese keys identical', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zhCN).sort());
  });

  it('does not contain empty messages', () => {
    expect(Object.values(zhCN).every((value) => value.trim().length > 0)).toBe(true);
    expect(Object.values(en).every((value) => value.trim().length > 0)).toBe(true);
  });
});
