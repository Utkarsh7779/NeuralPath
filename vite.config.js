import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local `npm run dev`, forward /api/* to `vercel dev` (running on 3000)
// so the AI proxy works the same locally as in production. Optional — only
// matters if you test AI features locally with `vercel dev`.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
    // three.js + recharts are large; raise the warning ceiling so the build is quiet.
    chunkSizeWarningLimit: 1600,
  },
});
