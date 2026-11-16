import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  clean: true,
  // The Anthropic SDK is only loaded when --ai is used, so keep it external.
  external: ['@anthropic-ai/sdk'],
});
