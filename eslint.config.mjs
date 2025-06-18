export default [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
  {
    rules: {
      semi: ['error', 'never'],
      'no-unused-vars': 'warn',
    },
  },
]