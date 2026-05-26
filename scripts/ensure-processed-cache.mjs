import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "data", ".cache", "processed.bin");
const xNpy = path.join(root, "data", "X_processed.npy");

if (!existsSync(cache) && existsSync(xNpy)) {
  console.log("[data:cache] Building processed.bin from .npy files…");
  execFileSync("python3", [path.join(root, "scripts", "build-processed-cache.py")], {
    stdio: "inherit",
    cwd: root,
  });
}
