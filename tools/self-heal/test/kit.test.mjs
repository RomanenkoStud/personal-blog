// Kit self-tests (zero deps): node --test tools/self-heal/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, parseYaml } from '../bin/load-config.mjs';
import { check } from '../bin/guard.mjs';

const kit = fileURLToPath(new URL('..', import.meta.url));
const defaults = parseYaml(`${kit}/defaults.yml`);
const cfg = (overlay = {}) => resolve(structuredClone(defaults), overlay);
const f = (path, status = ' M') => ({ path, status });

test('overlay replaces scalars and plain arrays', () => {
  const c = cfg({ agent: { model: 'opus', method_skills: ['x:y'] }, tests: { commands: ['npm t'] } });
  assert.equal(c.agent.model, 'opus');
  assert.deepEqual(c.agent.method_skills, ['x:y']);
  assert.deepEqual(c.tests.commands, ['npm t']);
  assert.equal(c.agent.max_turns, defaults.agent.max_turns);
});

test('safety floor arrays are appended, never replaced', () => {
  const c = cfg({ tests: { protected_paths: ['^migrations/'], forbidden_patterns: [] } });
  assert.ok(c.tests.protected_paths.includes('^\\.github/'));
  assert.ok(c.tests.protected_paths.includes('^migrations/'));
  assert.deepEqual(c.tests.forbidden_patterns, defaults.tests.forbidden_patterns);
});

test('computed tool lists include base tools, edit tools and extras', () => {
  const c = cfg({ tests: { allowed_tools: ['Bash(npx vitest:*)'] } });
  const tools = c.computed.tests_tools.split(',');
  for (const t of ['Read', 'Skill', 'Edit', 'Write', 'Bash(npx vitest:*)']) assert.ok(tools.includes(t), t);
  assert.ok(!c.computed.review_tools.split(',').includes('Edit'), 'reviewer cannot Edit');
});

test('guard: clean source fix passes', () => {
  assert.deepEqual(check('tests', cfg(), [f('src/lib/a.ts')], ['+  return x + 1;']), []);
});

test('guard: no changes is a violation', () => {
  assert.match(check('tests', cfg(), [], []).join(), /no changes/);
});

test('guard: protected paths from floor and overlay', () => {
  const c = cfg({ tests: { protected_paths: ['^migrations/'] } });
  const v = check('tests', c, [f('.github/workflows/ci.yml'), f('package.json'), f('migrations/0001.sql')], []);
  assert.equal(v.length, 3);
});

test('guard: deleted test file and skip/ts-ignore are rejected', () => {
  const v = check('tests', cfg(), [f('src/a.test.ts', ' D'), f('src/b.ts')], [
    "+  it.skip('works', () => {})",
    '+  // @ts-ignore',
  ]);
  assert.equal(v.length, 3, v.join('\n'));
});

test('guard: migrations limited to unapplied files in dir', () => {
  const c = cfg({ migrations: { dir: 'migrations' } });
  assert.deepEqual(check('migrations', c, [f('migrations/0007_x.sql', '??')], [], ['0006_y.sql']), []);
  const v = check('migrations', c, [f('migrations/0006_y.sql'), f('src/db.ts')], [], ['0006_y.sql']);
  assert.equal(v.length, 2, v.join('\n'));
});

test('repo overlay parses and resolves', () => {
  const overlay = parseYaml(fileURLToPath(new URL('../../../.github/self-heal/config.yml', import.meta.url)));
  const c = cfg(overlay);
  assert.equal(c.migrations.adapter, 'd1');
  assert.ok(c.tests.commands.length > 0);
  assert.ok(JSON.parse(JSON.stringify(c)));
  assert.ok(readFileSync(fileURLToPath(new URL('../../../.github/self-heal/context.md', import.meta.url)), 'utf8'));
});
