/**
 * Pure-TypeScript inference for the trained predictive-maintenance model.
 *
 * Architecture (see model/predictive_maintenance_model.keras):
 *   Input(50, 7) -> LSTM(64, tanh/sigmoid) -> Dropout(0.2) -> Dense(1, sigmoid)
 *
 * Dropout is inactive at inference, so it is not modelled here. The whole
 * network is 18,497 parameters, which makes a hand-written forward pass both
 * simpler and faster than pulling in a tensor runtime.
 *
 * Parity with the original Keras model is enforced by
 * scripts/verify-model-parity.mjs against src/lib/model/golden-fixtures.json.
 */

import {
  DENSE_BIAS_B64,
  DENSE_KERNEL_B64,
  LSTM_BIAS_B64,
  LSTM_KERNEL_B64,
  LSTM_RECURRENT_KERNEL_B64,
  MODEL_SHAPE,
} from "./weights";

const { sequenceLength: SEQUENCE_LENGTH, featureCount: FEATURE_COUNT, units: UNITS } =
  MODEL_SHAPE;

/**
 * Decode base64 little-endian float32. Read through a DataView so the result
 * does not depend on the host's endianness.
 */
function decodeFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);
  const out = new Float32Array(bytes.length / 4);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = view.getFloat32(i * 4, true);
  }
  return out;
}

// Decoded once at module load and reused across requests.
const LSTM_KERNEL = decodeFloat32(LSTM_KERNEL_B64); // (FEATURE_COUNT, 4*UNITS)
const LSTM_RECURRENT = decodeFloat32(LSTM_RECURRENT_KERNEL_B64); // (UNITS, 4*UNITS)
const LSTM_BIAS = decodeFloat32(LSTM_BIAS_B64); // (4*UNITS,)
const DENSE_KERNEL = decodeFloat32(DENSE_KERNEL_B64); // (UNITS, 1)
const DENSE_BIAS = decodeFloat32(DENSE_BIAS_B64); // (1,)

const GATE_STRIDE = 4 * UNITS;

function sigmoid(x: number): number {
  // Branch on sign to avoid overflow of exp() for large negative inputs.
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const e = Math.exp(x);
  return e / (1 + e);
}

/**
 * Run the LSTM + Dense head over one sequence.
 *
 * @param sequence flattened row-major (SEQUENCE_LENGTH, FEATURE_COUNT)
 * @returns failure probability in [0, 1]
 */
export function predictProbability(sequence: Float32Array): number {
  if (sequence.length !== SEQUENCE_LENGTH * FEATURE_COUNT) {
    throw new Error(
      `Expected ${SEQUENCE_LENGTH * FEATURE_COUNT} values, received ${sequence.length}.`,
    );
  }

  const h = new Float32Array(UNITS); // hidden state
  const c = new Float32Array(UNITS); // cell state
  const z = new Float32Array(GATE_STRIDE); // pre-activation gates

  for (let t = 0; t < SEQUENCE_LENGTH; t += 1) {
    const offset = t * FEATURE_COUNT;

    // z = b + x_t @ W + h_{t-1} @ U
    z.set(LSTM_BIAS);

    for (let f = 0; f < FEATURE_COUNT; f += 1) {
      const value = sequence[offset + f];
      if (value === 0) continue; // one-hot features make this a common shortcut
      const row = f * GATE_STRIDE;
      for (let g = 0; g < GATE_STRIDE; g += 1) {
        z[g] += value * LSTM_KERNEL[row + g];
      }
    }

    for (let u = 0; u < UNITS; u += 1) {
      const prev = h[u];
      if (prev === 0) continue;
      const row = u * GATE_STRIDE;
      for (let g = 0; g < GATE_STRIDE; g += 1) {
        z[g] += prev * LSTM_RECURRENT[row + g];
      }
    }

    // Keras packs the gates as [input, forget, cell, output].
    for (let u = 0; u < UNITS; u += 1) {
      const i = sigmoid(z[u]);
      const f = sigmoid(z[UNITS + u]);
      const candidate = Math.tanh(z[2 * UNITS + u]);
      const o = sigmoid(z[3 * UNITS + u]);

      const cell = f * c[u] + i * candidate;
      c[u] = cell;
      h[u] = o * Math.tanh(cell);
    }
  }

  let logit = DENSE_BIAS[0];
  for (let u = 0; u < UNITS; u += 1) {
    logit += h[u] * DENSE_KERNEL[u];
  }

  return sigmoid(logit);
}

export { SEQUENCE_LENGTH, FEATURE_COUNT, UNITS };
