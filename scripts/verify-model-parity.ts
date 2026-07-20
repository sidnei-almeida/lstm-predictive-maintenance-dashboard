/**
 * Proves the TypeScript inference port still matches the original Keras model.
 *
 * Replays golden fixtures — real (sequence -> probability) pairs produced by
 * Keras in scripts/extract-model-weights.py — through src/lib/model/lstm.ts and
 * fails if any probability drifts beyond the tolerance.
 *
 *   npm run model:verify
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { FEATURE_COUNT, SEQUENCE_LENGTH, predictProbability } from "../src/lib/model/lstm";

type GoldenCase = {
  sequence: number[][];
  expectedProbability: number;
};

type GoldenFixtures = {
  sequenceLength: number;
  featureCount: number;
  cases: GoldenCase[];
};

// float32 round-trip through base64 plus a different summation order leaves
// room for a few ULPs of drift; anything larger means the port is wrong.
const TOLERANCE = 1e-5;

function main(): void {
  const path = join(process.cwd(), "src/lib/model/golden-fixtures.json");
  const fixtures = JSON.parse(readFileSync(path, "utf8")) as GoldenFixtures;

  if (
    fixtures.sequenceLength !== SEQUENCE_LENGTH ||
    fixtures.featureCount !== FEATURE_COUNT
  ) {
    throw new Error(
      `Fixture shape (${fixtures.sequenceLength}, ${fixtures.featureCount}) does not match ` +
        `the model (${SEQUENCE_LENGTH}, ${FEATURE_COUNT}).`,
    );
  }

  let worst = 0;
  let worstIndex = -1;
  const failures: string[] = [];

  fixtures.cases.forEach((testCase, index) => {
    const flat = new Float32Array(SEQUENCE_LENGTH * FEATURE_COUNT);
    testCase.sequence.forEach((step, t) => {
      step.forEach((value, f) => {
        flat[t * FEATURE_COUNT + f] = value;
      });
    });

    const actual = predictProbability(flat);
    const delta = Math.abs(actual - testCase.expectedProbability);

    if (delta > worst) {
      worst = delta;
      worstIndex = index;
    }

    if (delta > TOLERANCE) {
      failures.push(
        `  case ${index}: expected ${testCase.expectedProbability.toFixed(9)}, ` +
          `got ${actual.toFixed(9)} (delta ${delta.toExponential(3)})`,
      );
    }
  });

  console.log(`Checked ${fixtures.cases.length} golden cases against Keras output.`);
  console.log(
    `Largest deviation: ${worst.toExponential(3)} (case ${worstIndex}), tolerance ${TOLERANCE.toExponential(0)}.`,
  );

  if (failures.length > 0) {
    console.error(`\n${failures.length} case(s) exceeded tolerance:`);
    console.error(failures.join("\n"));
    process.exit(1);
  }

  console.log("PASS — TypeScript inference matches the Keras model.");
}

main();
