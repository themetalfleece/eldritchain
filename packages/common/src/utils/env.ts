/**
 * Assert that a required environment variable exists
 * @param value - The env var value (pass process.env.X directly)
 * @param name - The env var name for error messages
 * @returns The value if it exists
 * @throws Error if value is undefined or empty
 */
export function assertEnv(value: string | undefined, name: string): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please set it in your .env file and restart the application.`
    );
  }
  return value;
}

/**
 * Parse a required integer environment variable
 */
export function assertEnvInt(value: string | undefined, name: string): number {
  const str = assertEnv(value, name);
  const num = parseInt(str, 10);

  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a valid integer, got: ${str}`);
  }

  return num;
}

/**
 * Parse a required bigint environment variable
 */
export function assertEnvBigInt(value: string | undefined, name: string): bigint {
  const str = assertEnv(value, name);

  try {
    return BigInt(str);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid number, got: ${str}`);
  }
}

/**
 * Assert ethereum address format
 */
export function assertEnvAddress(value: string | undefined, name: string): `0x${string}` {
  const str = assertEnv(value, name);

  if (!str.startsWith("0x") || str.length !== 42) {
    throw new Error(
      `Environment variable ${name} must be a valid Ethereum address (0x... with 42 characters), got: ${str}`
    );
  }

  return str as `0x${string}`;
}
