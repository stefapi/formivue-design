import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/zod.ts'],
  tsconfig: 'tsconfig.build.json',
  format: 'esm',
  dts: true,
  outDir: 'dist',
  target: 'es2020',
  sourcemap: true,
  clean: true,
})
