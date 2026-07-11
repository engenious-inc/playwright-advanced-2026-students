import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules',
      'test-results',
      'playwright-report',
      'dist',
      '.husky',
      // HyperFrames vendored skill pack + local video build output (gitignored, reproducible).
      '.agents',
      '.claude/skills',
      'build',
      // Runtime-only Playwright capture config; imports the base with a .ts extension that
      // Playwright's loader resolves but tsc/typed-eslint reject. Runtime-verified, not built.
      'playwright.capture.config.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      // AGENTS.md: suppression comments must carry a justification (a linked issue / reason),
      // never a bare silencer.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          'ts-nocheck': true,
          minimumDescriptionLength: 6,
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    plugins: {
      playwright,
    },
    rules: {
      ...playwright.configs.recommended.rules,
      'playwright/expect-expect': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-focused-test': 'error',
      // Forgotten unconditional `test.skip()` still warns (and fails CI via
      // --max-warnings=0); env-gated `test.skip(!!process.env.CI, ...)` is allowed.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/valid-expect': 'error',
      // AGENTS.md "Forbidden patterns": no raw setTimeout in test bodies, and no
      // hardcoded http(s):// URLs in tests (they belong in an adapter's endpoints.ts).
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: 'No raw setTimeout in tests — use web-first assertions or locator auto-wait.',
        },
        {
          selector: 'Literal[value=/^https?:\\/\\//]',
          message: 'No hardcoded URLs in test files — put them in the adapter endpoints.ts.',
        },
      ],
    },
  },
  {
    files: ['mcp-server/test/**/*.ts'],
    rules: {
      // node:test schedules async it() callbacks internally; the call itself is not a float.
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  prettierConfig,
];
