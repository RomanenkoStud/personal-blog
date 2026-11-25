import { describe, expect, it } from 'vitest';
import {
  SANDBOX_DEFAULT_HEIGHT,
  isSandboxBlock,
  parseSandboxBlock,
  sandboxOwnerRepo,
  sandboxProjectSlug,
  sandboxStackblitzUrl,
} from './sandbox';

const block = (...lines: string[]) => ['```sandbox', ...lines, '```'].join('\n');

describe('parseSandboxBlock', () => {
  it('parses every field', () => {
    expect(parseSandboxBlock(block('repo: o/r', 'branch: dev', 'file: src/a.ts', 'view: editor', 'height: 520', 'title: Demo'))).toEqual({
      repo: 'o/r', branch: 'dev', file: 'src/a.ts', view: 'editor', height: 520, title: 'Demo',
    });
  });

  it('requires repo', () => {
    expect(parseSandboxBlock(block('branch: main'))).toBeNull();
  });

  it('falls back to defaults for invalid view and height', () => {
    expect(parseSandboxBlock(block('repo: o/r', 'view: fullscreen', 'height: -1'))).toMatchObject({
      view: 'default', height: SANDBOX_DEFAULT_HEIGHT, branch: undefined,
    });
  });

  it('keeps colons inside values and ignores key case', () => {
    expect(parseSandboxBlock(block('Repo: o/r', 'title: a: b'))?.title).toBe('a: b');
  });
});

describe('sandbox URLs', () => {
  it('builds slugs and StackBlitz URLs', () => {
    expect(isSandboxBlock('  ```sandbox\nrepo: o/r\n```')).toBe(true);
    expect(sandboxOwnerRepo('o/r/tree/main/pkg')).toBe('o/r');
    expect(sandboxProjectSlug('o/r', 'dev')).toBe('o/r/tree/dev');
    expect(sandboxProjectSlug('o/r/tree/main', 'dev')).toBe('o/r/tree/main');
    expect(sandboxStackblitzUrl('o/r', undefined, 'src/a b.ts')).toBe('https://stackblitz.com/github/o/r?file=src%2Fa%20b.ts');
  });
});
