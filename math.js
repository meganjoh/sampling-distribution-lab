/** Statistical model for the Sampling Lab.
 * Independent draws from an exponential population with mean = SD = 8 minutes.
 * These are simulated wait times, not measured data.
 */
export const POPULATION_MEAN = 8;
export const POPULATION_SD = 8;
export const SAMPLE_SIZES = [1, 4, 36];
export const PLOT_MAX_X = 40;
export const BIN_COUNT = 50;

/** Draw one exponentially distributed random wait time, using inverse transform. */
export function drawWaitTime(random = Math.random) {
  const u = random();
  if (!(u >= 0 && u < 1)) throw new RangeError('random() must return a value from 0 (inclusive) to 1 (exclusive)');
  return -POPULATION_MEAN * Math.log1p(-u);
}

/** Draw n independent wait times and calculate their sample mean. */
export function drawSample(n, random = Math.random) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('sample size must be a positive integer');
  const values = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const value = drawWaitTime(random);
    values.push(value);
    total += value;
  }
  return { values, mean: total / n };
}

/** Calculate statistics for the observed collection of sample means. */
export function summarize(means) {
  const count = means.length;
  if (!count) return { count: 0, mean: null, sd: null };
  const mean = means.reduce((sum, value) => sum + value, 0) / count;
  if (count < 2) return { count, mean, sd: null };
  const sumSquares = means.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return { count, mean, sd: Math.sqrt(sumSquares / (count - 1)) };
}

/** Equal-width histogram with density normalization (total histogram area includes plotted data only).
 * Values outside the graph range are counted but not shown. Density is scaled by
 * the full number of observations so all sample sizes can be compared fairly.
 */
export function histogram(values, maxX = PLOT_MAX_X, binCount = BIN_COUNT) {
  const bins = Array(binCount).fill(0);
  let outOfRange = 0;
  for (const x of values) {
    if (!(x >= 0 && x < maxX)) {
      outOfRange++;
    } else {
      const index = Math.min(binCount - 1, Math.floor(x / maxX * binCount));
      bins[index]++;
    }
  }
  const binWidth = maxX / binCount;
  const densities = bins.map((count) => values.length ? count / (values.length * binWidth) : 0);
  return { densities, outOfRange, binWidth };
}

export function theoreticalStandardError(n) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('sample size must be positive');
  return POPULATION_SD / Math.sqrt(n);
}
