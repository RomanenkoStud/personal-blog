import { describe, expect, it } from 'vitest';
import { parseBodyBlocks, type BodyPlugin } from './body-parser';

const upper: BodyPlugin<string> = {
  fenceName: 'shout',
  parse: (raw) => (raw.includes('skip') ? null : raw.split('\n')[1].toUpperCase()),
};

describe('parseBodyBlocks', () => {
  it('returns a single markdown block when there are no fences', () => {
    expect(parseBodyBlocks('# Hi\n\ntext', [upper])).toEqual([{ type: 'markdown', content: '# Hi\n\ntext' }]);
  });

  it('splits markdown around a recognised plugin fence', () => {
    const body = 'intro\n\n```shout\nhello\n```\n\noutro';
    expect(parseBodyBlocks(body, [upper])).toEqual([
      { type: 'markdown', content: 'intro' },
      { type: 'plugin', plugin: 'shout', data: 'HELLO' },
      { type: 'markdown', content: 'outro' },
    ]);
  });

  it('keeps unknown fences and plugin parse failures as markdown, losing no content', () => {
    const body = '```ts\nconst a = 1;\n```\n\n```shout\nskip\n```';
    const blocks = parseBodyBlocks(body, [upper]);
    expect(blocks).toEqual([
      { type: 'markdown', content: '```ts\nconst a = 1;\n```' },
      { type: 'markdown', content: '```shout\nskip\n```' },
    ]);
  });

  it('is stable across calls (global regex state is reset)', () => {
    const body = 'a\n\n```shout\nx\n```';
    expect(parseBodyBlocks(body, [upper])).toEqual(parseBodyBlocks(body, [upper]));
  });
});
