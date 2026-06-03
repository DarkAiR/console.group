import { copyFile } from "node:fs/promises";

await copyFile("src/global.d.ts", "lib/global.d.ts");
console.log("✓ Copied global.d.ts to lib/");
