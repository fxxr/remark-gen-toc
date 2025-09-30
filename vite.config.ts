/// <reference types="vitest/config" />
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'remark-simple-toc',
      formats: ['es'],
      fileName: 'remark-simple-toc',
    },
    minify: false,
  },
  plugins: [dts({include: 'src/index.ts'})],
})