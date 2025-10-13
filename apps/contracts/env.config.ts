import * as dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string = ""): string {
  return process.env[name] || defaultValue;
}

export const env = {
  privateKey: requireEnv("PRIVATE_KEY"),
  defaultNetwork: optionalEnv("DEFAULT_NETWORK", "sepolia"),
  proxyAddress: optionalEnv("PROXY_ADDRESS"),
};
