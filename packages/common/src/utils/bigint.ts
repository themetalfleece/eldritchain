/** BigInt version of Math.max - returns the largest of the given BigInt values */
export function bigIntMax(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("bigIntMax requires at least one argument");
  }
  return values.reduce((max, val) => (val > max ? val : max), values[0]);
}

/** BigInt version of Math.min - returns the smallest of the given BigInt values */
export function bigIntMin(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("bigIntMin requires at least one argument");
  }
  return values.reduce((min, val) => (val < min ? val : min), values[0]);
}
