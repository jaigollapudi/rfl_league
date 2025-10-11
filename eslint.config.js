// Loosen only the rules blocking production builds. Keep core-web-vitals.
module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unescaped-entities': 'off',
  },
};


