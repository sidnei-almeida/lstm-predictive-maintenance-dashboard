#!/usr/bin/env python3
"""Convert X_processed.npy / y_processed.npy to a fast binary cache for Next.js."""

from __future__ import annotations

import struct
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CACHE_DIR = DATA / ".cache"
CACHE_FILE = CACHE_DIR / "processed.bin"
MAGIC = b"PMX1"


def row_to_floats(row) -> list[float]:
    out: list[float] = []
    for v in row:
        if isinstance(v, (bool, np.bool_)):
            out.append(float(v))
        else:
            out.append(float(v))
    return out


def main() -> int:
    x_path = DATA / "X_processed.npy"
    y_path = DATA / "y_processed.npy"

    if not x_path.is_file() or not y_path.is_file():
        print("Missing X_processed.npy or y_processed.npy in data/", file=sys.stderr)
        return 1

    X = np.load(x_path, allow_pickle=True)
    y = np.load(y_path)

    if X.ndim != 2 or X.shape[1] != 7:
        print(f"Expected X shape [N, 7], got {X.shape}", file=sys.stderr)
        return 1

    if y.ndim != 1 or y.shape[0] != X.shape[0]:
        print(f"Expected y shape [N] aligned with X, got {y.shape}", file=sys.stderr)
        return 1

    n, features = X.shape
    Xf = np.array([row_to_floats(r) for r in X], dtype=np.float32)
    yu = y.astype(np.uint8)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with CACHE_FILE.open("wb") as f:
        f.write(MAGIC)
        f.write(struct.pack("<II", n, features))
        f.write(Xf.tobytes(order="C"))
        f.write(yu.tobytes(order="C"))

    print(f"Wrote {CACHE_FILE} ({n} rows × {features} features)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
