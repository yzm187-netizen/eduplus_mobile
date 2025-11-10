module.exports = {
  root: true,
  env: { es2021: true, jest: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.expo/'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Soft guardrails to keep categories clean without blocking work
    'no-restricted-imports': ['warn', {
      patterns: [
        { group: ['@/utils', '@/utils/*'], message: 'Prefer @/lib/* for helpers (utils is being consolidated into lib/).' },
        { group: ['@/app/*'], message: 'Do not import from app/ routes. Move shared code to components/, lib/, services/, or providers/.' },
      ],
    }],
  },
};
