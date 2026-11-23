import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  outDir: 'dist',
  target: 'es2020',
  sourcemap: true,
  clean: true,
  loader: { '.svg': 'dataurl' },
  tsconfig: 'tsconfig.build.json',
})
