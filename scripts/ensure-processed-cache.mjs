import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "data", ".cache", "processed.bin");
const xNpy = path.join(root, "data", "X_processed.npy");
const pyScript = path.join(root, "scripts", "build-processed-cache.py");
const onVercel = process.env.VERCEL === "1";

if (existsSync(cache)) {
  console.log("[data:cache] Using committed processed.bin");
  process.exit(0);
}

if (!existsSync(xNpy)) {
  console.error("[data:cache] Missing data/X_processed.npy");
  process.exit(1);
}

if (onVercel) {
  console.error(
    "[data:cache] processed.bin is not in the repo. Vercel cannot run Python/NumPy.",
  );
  console.error(
    "  Local fix: npm run data:cache && git add -f data/.cache/processed.bin && git push",
  );
  process.exit(1);
}

console.log("[data:cache] Building processed.bin from .npy (requires python3 + numpy)…");
try {
  execFileSync("python3", [pyScript], { stdio: "inherit", cwd: root });
} catch {
  console.error("[data:cache] Python build failed. Install numpy or commit processed.bin.");
  process.exit(1);
}

if (!existsSync(cache)) {
  console.error("[data:cache] Build finished but processed.bin was not created.");
  process.exit(1);
}

console.log("[data:cache] processed.bin ready");
