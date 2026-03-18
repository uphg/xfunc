import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'docs/**', 'scripts/**', 'npm-packages/**', '*.config.js']
  },
  js.configs.recommended,
  stylistic.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@stylistic': stylistic
    },
    rules: {
      // 禁止特定语法
      'no-restricted-syntax': [
        'error',
        'WithStatement'
      ],
      'camelcase': 'error',
      'no-var': 'error',
      'no-empty': 'error',
      'prefer-const': [
        'warn',
        { destructuring: 'all' }
      ],
      'prefer-template': 'error',
      'object-shorthand': 'off',
      'no-constant-condition': 'error',
      'no-case-declarations': 'off',
      'prefer-spread': 'off',
      'prefer-rest-params': 'off',
      'no-undef': 'off',
      'no-useless-catch': 'off',

      // TypeScript handles function overloads correctly
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

      // Stylistic rules
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', 'never'],
      '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true }],
      '@stylistic/key-spacing': ['error', { afterColon: true }],
      '@stylistic/keyword-spacing': ['error', { before: true }],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': 'error',
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/brace-style': 'off',

      // TS
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          args: 'after-used',
          vars: 'all',
          caughtErrors: 'none'
        }
      ]
    }
  },
  {
    // 测试文件的特殊规则
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      '@stylistic/max-statements-per-line': 'off',
      'no-sparse-arrays': 'off',
      'camelcase': 'off'
    }
  },
  {
    // 打包后文件的特殊规则
    files: ['dist/**/*.{js,ts,d.ts}'],
    rules: {
      '@stylistic/no-mixed-operators': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off'
    }
  }
]
