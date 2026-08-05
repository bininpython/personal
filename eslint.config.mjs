import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off local import/seed utilities use CommonJS and are not bundled with the app.
    "generate-json.js",
    "register-chris.js",
    "seed-exercises.js",
    "scripts/test-register.js",
  ]),
]);

export default eslintConfig;
