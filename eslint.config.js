// ESLint flat config. `npm run lint` checks, `npm run lint:fix` applies safe autofixes
// (the self-heal `lint` route runs the latter deterministically, before any agent).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'tmp/', 'worker-configuration.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'error', // autofixable: the lint route's `eslint --fix` resolves it without an agent
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // TypeScript (astro check) already resolves identifiers, including env.d.ts globals.
    files: ['**/*.ts', '**/*.astro'],
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
