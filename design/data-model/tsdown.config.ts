import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', ui: 'src/ui/index.ts' },
  format: 'esm',
  dts: true,
  outDir: 'dist',
  target: 'es2020',
  sourcemap: true,
  clean: true,
  tsconfig: 'tsconfig.build.json',
})
