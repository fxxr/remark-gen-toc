/// <reference types="vitest/config" />
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'remark-gen-toc',
      formats: ['es'],
      fileName: 'remark-gen-toc',
    },
    minify: false,
  },
  plugins: [dts({include: 'src/index.ts'})],
})