import { assertEnvInt } from "@eldritchain/common";
import dotenv from "dotenv";

dotenv.config();

// API-specific configuration
export const apiConfig = {
  port: assertEnvInt(process.env.PORT, "PORT"),
};
