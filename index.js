import { existsSync } from "node:fs";
import { resolve } from "node:path";

const serverEntry = resolve(process.cwd(), "dist/index.cjs");

if (!existsSync(serverEntry)) {
  console.error("dist/index.cjs belum ada. Jalankan `npm run build` dulu.");
  process.exit(1);
}

await import(serverEntry);
