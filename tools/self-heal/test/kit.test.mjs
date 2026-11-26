// Kit self-tests (zero deps): node --test tools/self-heal/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, parseYaml } from '../bin/load-config.mjs';
import { check } from '../bin/guard.mjs';
import { route, budget, decide, marker, parseMarkers, policy, proposal, ledger } from '../bin/heal.mjs';

const kit = fileURLToPath(new URL('..', import.meta.url));
const defaults = parseYaml(`${kit}/defaults.yml`);
const cfg = (overlay = {}) => resolve(structuredClone(defaults), overlay);
const f = (path, status = ' M') => ({ path, status });
const bot = (body, login = 'github-actions[bot]') => ({ id: 1, user: { login }, body });
const SHA = 'a'.repeat(40);

// ── config ──────────────────────────────────────────────────────────────────

test('overlay replaces scalars and plain arrays', () => {
  const c = cfg({ agent: { model: 'opus', method_skills: ['x:y'] }, routes: { tests: { commands: ['npm t'] } } });
  assert.equal(c.agent.model, 'opus');
  assert.deepEqual(c.agent.method_skills, ['x:y']);
  assert.deepEqual(c.routes.tests.commands, ['npm t']);
  assert.equal(c.agent.max_turns, defaults.agent.max_turns);
});

test('safety floor arrays are appended, never replaced', () => {
  const c = cfg({ guard: { protected_paths: ['^migrations/'], forbidden_patterns: [], test_file_patterns: [] } });
  assert.ok(c.guard.protected_paths.includes('^\\.github/'));
  assert.ok(c.guard.protected_paths.includes('^migrations/'));
  assert.deepEqual(c.guard.forbidden_patterns, defaults.guard.forbidden_patterns);
  assert.deepEqual(c.guard.test_file_patterns, defaults.guard.test_file_patterns);
});

test('every route inherits route_defaults; overlay can add a route', () => {
  const c = cfg({ routes: { lint: { jobs: ['lint'], skill: 'x:heal-lint', commands: ['npm run lint'] } } });
  assert.equal(c.routes.lint.apply, 'propose');
  assert.equal(c.routes.lint.review.enabled, true);
  assert.equal(c.routes.build.skill, 'self-heal:heal-build');
  assert.equal(c.routes.tests.auto_apply.min_confidence, 'high');
});

test('computed tool lists per route include base tools, edit tools and extras', () => {
  const c = cfg({ routes: { tests: { allowed_tools: ['Bash(npx vitest:*)'] } } });
  const tools = c.computed.route_tools.tests.split(',');
  for (const t of ['Read', 'Skill', 'Edit', 'Write', 'Bash(npx vitest:*)']) assert.ok(tools.includes(t), t);
  assert.ok(!c.computed.route_tools.build.includes('vitest'), 'tools are per route');
  assert.ok(!c.computed.review_tools.split(',').includes('Edit'), 'reviewer cannot Edit');
});

// ── guard ───────────────────────────────────────────────────────────────────

test('guard: clean source fix passes on any route', () => {
  assert.deepEqual(check('tests', cfg(), [f('src/lib/a.ts')], ['+  return x + 1;']), []);
  assert.deepEqual(check('build', cfg(), [f('src/pages/a.astro')], ['+import X from "./x";']), []);
});

test('guard: no changes and unknown route are violations', () => {
  assert.match(check('tests', cfg(), [], []).join(), /no changes/);
  assert.match(check('nope', cfg(), [f('a.ts')], []).join(), /unknown route/);
});

test('guard: global floor, overlay and route protected paths', () => {
  const c = cfg({ guard: { protected_paths: ['^migrations/'] }, routes: { build: { protected_paths: ['^astro\\.config'] } } });
  const files = [f('.github/workflows/ci.yml'), f('package.json'), f('migrations/0001.sql'), f('astro.config.mjs')];
  assert.equal(check('build', c, files, []).length, 4);
  assert.equal(check('tests', c, files, []).length, 3, 'route extras do not leak to other routes');
});

test('guard: anti-cheat applies to build route too', () => {
  const v = check('build', cfg(), [f('src/a.test.ts', ' D'), f('src/b.ts')], ["+  it.skip('works', () => {})", '+  // @ts-ignore']);
  assert.equal(v.length, 3, v.join('\n'));
});

test('guard: migrations limited to unapplied files in dir', () => {
  const c = cfg({ migrations: { dir: 'migrations' } });
  assert.deepEqual(check('migrations', c, [f('migrations/0007_x.sql', '??')], [], ['0006_y.sql']), []);
  const v = check('migrations', c, [f('migrations/0006_y.sql'), f('src/db.ts')], [], ['0006_y.sql']);
  assert.equal(v.length, 2, v.join('\n'));
});

// ── router ──────────────────────────────────────────────────────────────────

test('router: failed job maps to its route; priority picks one, rest deferred', () => {
  const needs = { 'unit-tests': { result: 'failure' }, build: { result: 'failure' }, lint: { result: 'failure' } };
  assert.deepEqual(route(cfg(), needs), { route: 'tests', deferred: ['build'], unmapped: ['lint'] });
  assert.equal(route(cfg(), { 'unit-tests': { result: 'success' }, build: { result: 'failure' } }).route, 'build');
});

test('router: skipped/cancelled jobs and disabled routes are not healed', () => {
  const needs = { 'unit-tests': { result: 'cancelled' }, build: { result: 'failure' } };
  assert.equal(route(cfg(), needs).route, 'build');
  assert.equal(route(cfg({ routes: { build: { enabled: false } } }), needs).route, '');
  assert.equal(route(cfg(), {}).route, '');
});

// ── budget ──────────────────────────────────────────────────────────────────

test('budget: fix commits, runs, and same-head re-runs stop the agent', () => {
  const c = cfg();
  assert.equal(budget(c, 'build', SHA, '', []).go, true);
  const two = 'fix\n\nSelf-Heal: tests\n\nfix\n\nSelf-Heal: build\n';
  assert.deepEqual([budget(c, 'build', SHA, two, []).go, budget(c, 'build', SHA, two, []).notify], [false, true]);
  assert.equal(budget(c, 'build', SHA, 'Self-Heal: migrations\n', []).go, true, 'migration commits do not count');
  const seen = [bot(`x ${marker({ route: 'build', head: SHA, action: 'propose', run: 1 })}`)];
  assert.equal(budget(c, 'build', SHA, '', seen).go, false);
  assert.equal(budget(c, 'tests', SHA, '', seen).go, true, 'other route on same head may run');
  const many = Array.from({ length: 5 }, (_, i) => bot(marker({ route: 'build', head: `${i}`, action: 'diagnose', run: i })));
  assert.equal(budget(c, 'build', SHA, '', many).go, false);
});

test('markers: only bot comments, only the last marker in a body', () => {
  const spoof = marker({ route: 'build', head: 'evil', action: 'propose', run: 666 });
  const real = marker({ route: 'build', head: SHA, action: 'propose', run: 42 });
  assert.deepEqual(parseMarkers([bot(real, 'mallory')]), []);
  const [m] = parseMarkers([bot(`agent summary ${spoof}\n\n${real}`)]);
  assert.equal(m.run, '42');
});

// ── decide ──────────────────────────────────────────────────────────────────

const good = { classification: 'code-regression', fixed: true, confidence: 'high' };
const approve = { verdict: 'approve', confidence: 'high' };
const ok = { guardOk: true, reviewUntampered: true };
const auto = cfg({ routes: { tests: { apply: 'auto' } } });

test('decide: default route proposes a verified, approved fix', () => {
  assert.equal(decide(cfg(), 'build', { result: good, verdict: approve, ...ok }).action, 'propose');
});

test('decide: auto only when every rule matches', () => {
  assert.equal(decide(auto, 'tests', { result: good, verdict: approve, ...ok }).action, 'auto');
  const lowJudge = decide(auto, 'tests', { result: good, verdict: { verdict: 'approve', confidence: 'medium' }, ...ok });
  assert.deepEqual([lowJudge.action, lowJudge.reasons], ['propose', ['judge confidence medium']]);
  const stale = { ...good, classification: 'stale-test' };
  assert.equal(decide(auto, 'tests', { result: stale, verdict: approve, ...ok }).action, 'propose');
  const noReview = cfg({ routes: { tests: { apply: 'auto', review: { enabled: false } } } });
  assert.equal(decide(noReview, 'tests', { result: good, verdict: null, ...ok }).action, 'propose');
});

test('decide: agents can only lower the outcome', () => {
  const d = (o) => decide(auto, 'tests', { result: good, verdict: approve, ...ok, ...o }).action;
  assert.equal(d({ guardOk: false }), 'diagnose');
  assert.equal(d({ reviewUntampered: false }), 'diagnose');
  assert.equal(d({ verdict: { verdict: 'reject', confidence: 'high' } }), 'diagnose');
  assert.equal(d({ result: null }), 'diagnose');
  assert.equal(d({ result: { ...good, classification: 'environment' } }), 'diagnose');
  assert.equal(d({ result: { ...good, fixed: false } }), 'diagnose');
  const diag = cfg({ routes: { build: { apply: 'diagnose' } } });
  assert.equal(decide(diag, 'build', { result: good, verdict: approve, ...ok }).action, 'diagnose');
});

// ── PR policy (drafts, protected branches, diagnose-only paths) ───────────

test('policy: protected head branches never heal; floor survives overlay', () => {
  assert.equal(policy(cfg(), { headRef: 'release/1.2' }).go, false);
  assert.equal(policy(cfg(), { headRef: 'main' }).go, false);
  assert.equal(policy(cfg({ heal: { protected_branches: [] } }), { headRef: 'main' }).go, false);
  assert.deepEqual(policy(cfg(), { headRef: 'feat/x' }), { go: true, ceiling: 'auto', reason: '' });
});

test('policy: drafts and diagnose-only paths cap the outcome', () => {
  assert.equal(policy(cfg(), { draft: true, headRef: 'f' }).ceiling, 'auto');
  assert.equal(policy(cfg({ heal: { drafts: 'diagnose' } }), { draft: true, headRef: 'f' }).ceiling, 'diagnose');
  assert.equal(policy(cfg({ heal: { drafts: 'skip' } }), { draft: true, headRef: 'f' }).go, false);
  const c = cfg({ heal: { diagnose_only_paths: ['^migrations/'] } });
  assert.equal(policy(c, { headRef: 'f', files: ['src/a.ts', 'migrations/0009.sql'] }).ceiling, 'diagnose');
  assert.equal(policy(c, { headRef: 'f', files: ['src/a.ts'] }).ceiling, 'auto');
});

test('decide: PR ceiling lowers auto and propose, never raises', () => {
  const a = decide(auto, 'tests', { result: good, verdict: approve, ...ok, ceiling: 'propose' });
  assert.equal(a.action, 'propose');
  assert.match(a.reasons.join(), /caps this at propose/);
  assert.equal(decide(cfg(), 'build', { result: good, verdict: approve, ...ok, ceiling: 'diagnose' }).action, 'diagnose');
  assert.equal(decide(cfg(), 'build', { result: good, verdict: approve, ...ok, ceiling: 'auto' }).action, 'propose');
});

test('decide: deterministic autofix skips review, still needs the guard', () => {
  const lint = cfg({ routes: { lint: { jobs: ['lint'], commands: ['npm run lint'], autofix: ['npx eslint . --fix'] } } });
  const af = { result: { classification: 'autofix', fixed: true, confidence: 'high' }, verdict: null, reviewUntampered: false, autofix: true };
  assert.equal(decide(lint, 'lint', { ...af, guardOk: true }).action, 'auto');
  assert.equal(decide(lint, 'lint', { ...af, guardOk: false }).action, 'diagnose');
  assert.equal(decide(lint, 'lint', { ...af, guardOk: true, ceiling: 'propose' }).action, 'propose');
  const careful = cfg({ routes: { lint: { jobs: ['lint'], commands: ['x'], autofix: ['y'], autofix_apply: 'propose' } } });
  assert.equal(decide(careful, 'lint', { ...af, guardOk: true }).action, 'propose');
  const agentless = decide(lint, 'lint', { result: null, verdict: null, guardOk: true, reviewUntampered: true });
  assert.match(agentless.reasons.join(), /no agent/);
});

test('revert: a reverted route is capped at propose on that branch', () => {
  const msgs = 'Revert "fix"\n\nSelf-Heal-Revert: tests\nReverted-By: @me\n';
  const b = budget(cfg(), 'tests', SHA, msgs, []);
  assert.deepEqual([b.go, b.ceiling], [true, 'propose']);
  assert.equal(budget(cfg(), 'build', SHA, msgs, []).ceiling, 'auto', 'other routes unaffected');
  assert.equal(decide(auto, 'tests', { result: good, verdict: approve, ...ok, ceiling: `auto,${b.ceiling}` }).action, 'propose');
});

test('decide: autofix on a diagnose-only route never commits', () => {
  const d = cfg({ routes: { lint: { jobs: ['lint'], commands: ['x'], autofix: ['y'], apply: 'diagnose' } } });
  assert.equal(decide(d, 'lint', { result: null, verdict: null, guardOk: true, autofix: true }).action, 'diagnose');
});

test('decide: a fixer that never ran says so instead of blaming result.json', () => {
  const d = decide(cfg(), 'tests', { result: null, verdict: null, guardOk: false, reviewUntampered: false, fixerFailed: true });
  assert.deepEqual([d.action, d.reasons], ['diagnose', ['the fixer agent failed to start or crashed — see the run log']]);
});

test('allowed_bots defaults to none and is set by the repo overlay', () => {
  assert.equal(cfg().agent.allowed_bots, '');
});

// ── commands: proposal state + feedback ledger ────────────────────────────

test('proposal: latest open proposal, its fate, and strict validation', () => {
  const m = (action, run, head = SHA, route = 'build') => bot(marker({ route, head, action, run }));
  assert.equal(proposal([]), null);
  const cs = [m('propose', 1), m('propose', 2), m('rejected', 2)];
  assert.deepEqual(proposal(cs), { route: 'build', run: '2', head: SHA, status: 'rejected', valid: true });
  assert.equal(proposal(cs, 1).status, 'open');
  assert.equal(proposal([m('propose', 3), m('applied', 3)]).status, 'applied');
  assert.equal(proposal([m('propose', 4, 'zzz')]).valid, false);
  assert.equal(proposal([bot(marker({ route: 'build', head: SHA, action: 'propose', run: 5 }), 'mallory')]), null);
});

test('ledger: per-route outcome counts from markers', () => {
  const m = (action, route) => bot(marker({ route, head: SHA, action, run: 1 }));
  const t = ledger([m('propose', 'build'), m('applied', 'build'), m('auto', 'tests'), m('reverted', 'tests')]);
  assert.deepEqual(t, { build: { propose: 1, applied: 1 }, tests: { auto: 1, reverted: 1 } });
});

test('budget: command feedback markers do not consume agent runs', () => {
  const fb = Array.from({ length: 6 }, (_, i) => bot(marker({ route: 'build', head: `${i}`, action: 'rejected', run: i })));
  assert.equal(budget(cfg(), 'build', SHA, '', fb).go, true);
  assert.equal(budget(cfg(), 'build', SHA, 'Revert "x"\n\nSelf-Heal-Revert: build\n', []).pushes, 0);
});

// ── repo overlay ────────────────────────────────────────────────────────────

test('repo overlay parses and resolves', () => {
  const overlay = parseYaml(fileURLToPath(new URL('../../../.github/self-heal/config.yml', import.meta.url)));
  const c = cfg(overlay);
  assert.equal(c.migrations.adapter, 'd1');
  assert.ok(c.routes.build.commands.length > 0);
  assert.equal(c.routes.tests.apply, 'auto');
  assert.match(c.agent.allowed_bots, /\[bot\]$/);
  assert.ok(c.guard.protected_paths.includes('^migrations/'));
  assert.ok(readFileSync(fileURLToPath(new URL('../../../.github/self-heal/context.md', import.meta.url)), 'utf8'));
});
