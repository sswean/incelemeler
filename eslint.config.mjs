// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

// REQ-GUV-004: ham HTML yalnızca JSON-LD için, `</script>` kaçışlı güvenli serileştiriciyle.
const JSON_LD_ONLY = {
  selector:
    "JSXAttribute[name.name='dangerouslySetInnerHTML']:not(:has(CallExpression[callee.name='jsonLdScript']))",
  message: 'dangerouslySetInnerHTML yalnızca jsonLdScript(...) ile JSON-LD için kullanılabilir.',
};
const CLIENT = "Program:has(> ExpressionStatement[directive='use client'])";

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      '**/next-env.d.ts',
      'prompts/**',
      'packages/api-client/src/schema.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // AK-11 / §12.2: gerekçesiz devre dışı bırakma yorumu yasak
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['apps/api/src/**/*.ts'],
    rules: {
      // REQ-GUV-003: ham SQL yalnızca parametreli etiketli şablonlarla ($queryRaw`…`, Prisma.sql`…`).
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name=/^\\$(queryRaw|executeRaw)Unsafe$/]',
          message: 'Parametresiz ham SQL yasak; $queryRaw`…` etiketli şablonunu kullan.',
        },
        {
          selector: "MemberExpression[object.name='Prisma'][property.name='raw']",
          message:
            'Prisma.raw yasak; dinamik parçalar beyaz listeli Prisma.sql parçalarından seçilir.',
        },
      ],
    },
  },
  {
    files: ['apps/**/*.tsx'],
    rules: { 'no-restricted-syntax': ['error', JSON_LD_ONLY] },
  },
  {
    files: ['apps/web/**/*.tsx'],
    rules: {
      // REQ-PRF-004: istemci bileşenleri tüm i18n kataloğunu ya da zod şemalarını pakete çekmez.
      'no-restricted-syntax': [
        'error',
        JSON_LD_ONLY,
        {
          selector: `${CLIENT} ImportDeclaration[source.value='@incelemeler/i18n'] ImportSpecifier[imported.name='tr']`,
          message:
            "İstemci bileşeninde yalnızca kullanılan ad alanını içe aktar (ör. import { search } from '@incelemeler/i18n').",
        },
        {
          selector: `${CLIENT} ImportDeclaration[source.value='@incelemeler/contracts'][importKind='value'] > ImportSpecifier[importKind='value']`,
          message:
            'İstemci bileşeni @incelemeler/contracts kökünden değer içe aktarmaz (zod); tip ya da zod içermeyen alt yol kullan.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.int.test.ts'],
    plugins: { vitest },
    rules: {
      // AK-11: odaklanmış/atlanmış test yasak
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
    },
  },
  {
    files: ['tests/e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', '**/scripts/**/*.mjs', 'tests/e2e/prepare-db.mjs'],
    rules: { 'no-console': 'off' },
  },
);
