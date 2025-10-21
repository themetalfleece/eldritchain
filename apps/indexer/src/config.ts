import { assertEnv } from "@eldritchain/common";
import dotenv from "dotenv";

dotenv.config();

// Shared/common configuration used by multiple services
export const config = {
  mongodb: {
    uri: assertEnv(process.env.MONGODB_URI, "MONGODB_URI"),
  },
};
