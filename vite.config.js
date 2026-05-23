import { defineConfig } from "vite";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";

function copyLegacyRuntime() {
  const root = process.cwd();
  const outDir = resolve(root, "dist");

  function copyEntry(source, target) {
    const stats = statSync(source);
    if (stats.isDirectory()) {
      mkdirSync(target, { recursive: true });
      for (const child of readdirSync(source)) {
        copyEntry(resolve(source, child), resolve(target, child));
      }
      return;
    }
    mkdirSync(resolve(target, ".."), { recursive: true });
    copyFileSync(source, target);
  }

  return {
    name: "copy-legacy-runtime",
    closeBundle() {
      mkdirSync(outDir, { recursive: true });
      for (const entry of ["assets", "scripts", "game.js", "index.html", "style.css"]) {
        const target = resolve(outDir, entry);
        if (existsSync(target)) {
          rmSync(target, { recursive: true, force: true });
        }
        copyEntry(resolve(root, entry), target);
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyLegacyRuntime()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "scripts/main.module.js"),
    },
  },
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
  },
});
