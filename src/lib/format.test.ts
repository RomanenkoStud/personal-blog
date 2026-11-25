import { describe, expect, it } from 'vitest';
import { formatDateRange, formatFileSize, formatMonthYear, stripMarkdown, truncate } from './format';

describe('formatFileSize', () => {
  it('uses B, KB and MB with one decimal', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatMonthYear', () => {
  it('formats an ISO date as "Month YYYY"', () => {
    expect(formatMonthYear('2026-03-15T12:00:00Z')).toBe('March 2026');
  });
});

describe('formatDateRange', () => {
  it('counts months inclusively and pluralises', () => {
    expect(formatDateRange('2020-01', '2021-02')).toBe('Jan 2020 – Feb 2021 · 1 yr 2 mos');
    expect(formatDateRange('2024-05', '2024-05')).toBe('May 2024 – May 2024 · 1 mo');
    expect(formatDateRange('2020-01', '2021-12')).toBe('Jan 2020 – Dec 2021 · 2 yrs');
  });

  it('shows Present for an open range and nothing without a start', () => {
    expect(formatDateRange('2020-01', '')).toMatch(/^Jan 2020 – Present · /);
    expect(formatDateRange('', '2020-01')).toBe('');
  });
});

describe('stripMarkdown', () => {
  it('drops headings, emphasis, list markers and link targets', () => {
    const md = '# Title\n\nSome **bold** and *em* text.\n\n- item one\n- [a link](https://x.dev)';
    expect(stripMarkdown(md)).toBe('Some bold and em text. item one a link');
  });
});

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('hello world', 20)).toBe('hello world');
  });

  it('cuts at a word boundary and adds an ellipsis', () => {
    expect(truncate('the quick brown fox jumps', 12)).toBe('the quick…');
  });
});
