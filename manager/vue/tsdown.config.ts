import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  tsconfig: 'tsconfig.build.json',
  format: 'esm',
  dts: { resolve: ['@vue/runtime-core'] },
  outDir: 'dist',
  target: 'es2020',
  sourcemap: true,
  clean: true,
})
