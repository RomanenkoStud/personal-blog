#!/usr/bin/env node
// Deterministic decisions for the PR healing pipeline (workflows/self-heal.yml).
// No LLM is involved in any of these: they decide WHICH healer runs, WHETHER it may run,
// and WHAT happens to its fix. The agent's own output can only narrow those choices.
//
//   heal.mjs route  <config.json>                        (env NEEDS = toJSON(needs))
//   heal.mjs budget <config.json> <route> <head-sha> <commit-messages.txt> <comments.json>
//   heal.mjs decide <config.json> <route> <heal-dir>      (env GUARD_OK, REVIEW_UNTAMPERED)
//
// route/decide print key=value lines for $GITHUB_OUTPUT (decide also writes <heal-dir>/decision.json);
// budget prints JSON (its reason is free text).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const MARKER = 'self-heal:run';
export const FIXABLE = ['code-regression', 'stale-test'];
const RANK = { low: 1, medium: 2, high: 3 };

/** Map failed CI jobs to the single route to heal this run. */
export function route(cfg, needs) {
  const failed = Object.entries(needs ?? {})
    .filter(([, n]) => n?.result === 'failure')
    .map(([job]) => job);
  const byJob = new Map();
  for (const [name, r] of Object.entries(cfg.routes)) {
    if (r.enabled === false) continue;
    for (const job of r.jobs ?? []) byJob.set(job, name);
  }
  const routes = [...new Set(failed.map((j) => byJob.get(j)).filter(Boolean))];
  const order = (n) => {
    const i = cfg.heal.priority.indexOf(n);
    return i === -1 ? Infinity : i;
  };
  routes.sort((a, b) => order(a) - order(b));
  return {
    route: routes[0] ?? '',
    deferred: routes.slice(1),
    unmapped: failed.filter((j) => !byJob.has(j)),
  };
}

/** Hidden marker every self-heal PR comment carries; the budget counts these. */
export const marker = (fields) =>
  `<!-- ${MARKER} ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(' ')} -->`;

export function parseMarkers(comments, botLogin = 'github-actions[bot]') {
  const re = new RegExp(`<!-- ${MARKER} ([^>]*?) -->`, 'g');
  return comments
    .filter((c) => c?.user?.login === botLogin) // only the bot's own comments are trusted
    .map((c) => {
      // The workflow appends the marker AFTER any agent-written text, so only the last one counts.
      const m = [...(c.body ?? '').matchAll(re)].at(-1);
      if (!m) return null;
      return { id: c.id, ...Object.fromEntries(m[1].split(/\s+/).map((kv) => kv.split('='))) };
    })
    .filter(Boolean);
}

/** May an agent run for this route on this head? */
export function budget(cfg, routeName, head, commitMessages, comments) {
  const pushes = (commitMessages.match(/^Self-Heal: (?!migrations\b)\S+/gm) ?? []).length;
  const runs = parseMarkers(comments);
  if (pushes >= cfg.heal.max_attempts)
    return { go: false, notify: true, pushes, reason: `${pushes} fix commit(s) already on this branch — needs a human` };
  if (runs.length >= cfg.heal.max_runs)
    return { go: false, notify: false, pushes, reason: `${runs.length} self-heal runs already on this PR (max_runs)` };
  if (runs.some((r) => r.head === head && r.route === routeName))
    return { go: false, notify: false, pushes, reason: `already handled ${routeName} at ${head.slice(0, 7)} (re-run)` };
  return { go: true, notify: false, pushes, reason: '' };
}

const readJson = (f) => {
  try {
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  } catch {
    return null;
  }
};

/**
 * What happens to the fix: auto (commit), propose (comment + /heal apply) or diagnose.
 * Config sets the ceiling; the agents' outputs can only lower it.
 */
export function decide(cfg, routeName, { result, verdict, guardOk, reviewUntampered }) {
  const r = cfg.routes[routeName];
  const reasons = [];
  if (!result) return { action: 'diagnose', reasons: ['fixer produced no result.json'] };
  if (result.fixed !== true || !FIXABLE.includes(result.classification))
    return { action: 'diagnose', reasons: [`classified ${result.classification ?? 'unknown'}, no fix offered`] };
  if (!guardOk) return { action: 'diagnose', reasons: ['guardrail or re-verification failed'] };
  if (r.review.enabled) {
    if (!reviewUntampered) return { action: 'diagnose', reasons: ['reviewer modified the working tree'] };
    if (verdict?.verdict !== 'approve')
      return { action: 'diagnose', reasons: ['independent review rejected the fix', ...(verdict?.reasons ?? [])] };
  }
  if (r.apply === 'diagnose') return { action: 'diagnose', reasons: ['route is diagnose-only'] };
  if (r.apply !== 'auto') return { action: 'propose', reasons: ['route requires a human to apply'] };

  const min = RANK[r.auto_apply.min_confidence] ?? RANK.high;
  if (!r.review.enabled) reasons.push('auto-apply requires the independent review');
  if (!r.auto_apply.classifications.includes(result.classification))
    reasons.push(`${result.classification} is not auto-applied on this route`);
  if ((RANK[result.confidence] ?? 0) < min) reasons.push(`fixer confidence ${result.confidence ?? 'none'}`);
  if (r.review.enabled && (RANK[verdict?.confidence] ?? 0) < min)
    reasons.push(`judge confidence ${verdict?.confidence ?? 'none'}`);
  return reasons.length ? { action: 'propose', reasons } : { action: 'auto', reasons: ['all auto-apply rules matched'] };
}

const out = (o) => {
  for (const [k, v] of Object.entries(o)) process.stdout.write(`${k}=${Array.isArray(v) ? v.join(',') : v}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, cfgFile, ...rest] = process.argv.slice(2);
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  if (cmd === 'route') {
    out(route(cfg, JSON.parse(process.env.NEEDS || '{}')));
  } else if (cmd === 'budget') {
    const [routeName, head, commitsFile, commentsFile] = rest;
    const comments = JSON.parse(readFileSync(commentsFile, 'utf8')).flat(); // gh api --paginate --slurp
    process.stdout.write(JSON.stringify(budget(cfg, routeName, head, readFileSync(commitsFile, 'utf8'), comments)));
  } else if (cmd === 'decide') {
    const [routeName, dir] = rest;
    const d = decide(cfg, routeName, {
      result: readJson(`${dir}/result.json`),
      verdict: readJson(`${dir}/verdict.json`),
      guardOk: process.env.GUARD_OK === 'true',
      reviewUntampered: process.env.REVIEW_UNTAMPERED === 'true',
    });
    writeFileSync(`${dir}/decision.json`, JSON.stringify(d, null, 2));
    out({ action: d.action });
  } else {
    console.error(`unknown command ${cmd}`);
    process.exit(2);
  }
}
