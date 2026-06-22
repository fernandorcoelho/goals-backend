import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'prisma/migrations/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Desliga regras de estilo que conflitam com o Prettier (formatação fica a
  // cargo do Prettier; o ESLint cuida apenas da qualidade do código).
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Augmentations de tipos (ex.: Express.Request) usam `namespace`.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
);
