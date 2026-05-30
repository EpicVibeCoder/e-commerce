import { assertRequiredEnv } from "../packages/shared/src/env-spec.js";

assertRequiredEnv(process.env);
console.log("✅ Environment OK");