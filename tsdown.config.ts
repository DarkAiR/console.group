import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true, // Генерировать .d.ts файлы
	entry: ["src/index.ts"],
	fixedExtension: false, // Позволяет генерировать .mjs и .cjs
	outDir: "lib",
	minify: true,
	format: ["esm"],
	target: "es2019",
});
