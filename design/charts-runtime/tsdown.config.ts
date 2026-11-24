import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/data-contract.ts'],
  format: 'esm',
  dts: true,
  outDir: 'dist',
  target: 'es2020',
  sourcemap: true,
  clean: true,
  tsconfig: 'tsconfig.build.json',
})
