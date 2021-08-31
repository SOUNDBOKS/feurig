import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/main.tsx"),
      name: "react-hierarchical-flamechart",
      fileName: (format) => `react-hierarchical-flamechart.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
        }
      }
    }
  }
})
