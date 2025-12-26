import { config } from '@m1nsuppp/eslint-config';

export default [
  ...config,
  {
    ignores: ['dist/**'],
  },
];
