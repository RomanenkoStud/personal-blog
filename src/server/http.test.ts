import { describe, expect, it } from 'vitest';
import { readJsonObject } from './http';

const req = (body: string) => new Request('https://example.dev', { method: 'POST', body });

describe('readJsonObject', () => {
  it('returns JSON objects as-is', async () => {
    expect(await readJsonObject(req('{"title":"Hi"}'))).toEqual({ title: 'Hi' });
  });

  it('turns arrays, primitives and null into an empty object', async () => {
    for (const body of ['[1,2]', '"text"', '42', 'null']) expect(await readJsonObject(req(body))).toEqual({});
  });
});
