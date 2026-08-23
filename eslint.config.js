import { renovamen, tseslint } from "@renovamen/eslint-config";

export default renovamen({
  plugins: {
    "@typescript-eslint": tseslint.plugin
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }]
  }
});
