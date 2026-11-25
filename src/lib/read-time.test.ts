import { describe, expect, it } from 'vitest';
import { calcReadTime } from './read-time';

describe('calcReadTime', () => {
  it('is at least one minute', () => {
    expect(calcReadTime('')).toBe(1);
  });

  it('rounds up at 200 words per minute and ignores markup', () => {
    const words = (n: number) => Array.from({ length: n }, () => '**word**').join(' ');
    expect(calcReadTime(words(200))).toBe(1);
    expect(calcReadTime(words(201))).toBe(2);
  });
});
