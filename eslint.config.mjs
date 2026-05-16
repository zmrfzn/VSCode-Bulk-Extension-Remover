import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        __dirname: "readonly",
        console: "readonly",
        process: "readonly",
        suite: "readonly",
        test: "readonly"
      }
    },
    rules: {
      curly: "warn",
      eqeqeq: "warn",
      semi: ["warn", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_"
        }
      ]
    }
  }
);
