import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true,
	entry: ["src/index.ts"],
	fixedExtension: false,
	outDir: "lib",
	minify: true,
});
