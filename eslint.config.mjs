import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([globalIgnores([".output/**", ".tanstack/**", "dist/**", "build/**", "src/routeTree.gen.ts"])]);

export default eslintConfig;
