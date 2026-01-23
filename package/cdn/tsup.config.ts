import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },

  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "dist",
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: "es2020",
});
