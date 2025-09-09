// migrated from .eslintrc.json: npx @eslint/migrate-config .eslintrc.json
// ESLint 9.0 use flat config: https://eslint.org/blog/2024/04/eslint-v9.0.0-released/
// https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-resolution
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import pluginCypress from 'eslint-plugin-cypress/flat';
import _import from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...fixupConfigRules(
    compat.extends(
      'next/core-web-vitals',
      'eslint:recommended', // basic recommended set of rules provided by ESLint
      'plugin:react/recommended', // recommended rules for React components and JSX
      'plugin:@next/next/recommended', //  recommended rules for Next.js
      'plugin:import/typescript', //  TypeScript support for import/export rules
      'plugin:@typescript-eslint/recommended'
    )
  ),
  {
    plugins: {
      react: fixupPluginRules(react), // includes React-specific linting rules
      'react-hooks': fixupPluginRules(reactHooks), // includes linting rules for React hooks
      import: fixupPluginRules(_import), // includes rules to validate import/export syntax and prevent issues related to module imports

      cypress: pluginCypress,
    },
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // code is expected to run in a browser environment
        ...pluginCypress.configs.globals,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: false,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-explicit-any': ['off'],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': [
        'error',
        {
          ignore: ['css'], // Add 'css' to the ignore list
        },
      ],
      '@next/next/no-img-element': 'off',
      'no-unused-vars': [
        'off',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // Import sorting rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // npm packages
            'internal', // internal modules (relative to current file)
            'parent', // parent directory imports
            'sibling', // same directory imports
            'index', // index file imports
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'next/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // Turn off for TypeScript projects
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'import/order': 'off', // Disable expensive import sorting for test files
    },
  },
];
