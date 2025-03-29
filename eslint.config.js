module.exports = [
  {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    ignores: ["node_modules", "dist"], // Replace with directories to ignore
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      prettier: require("eslint-plugin-prettier"),
    },
    rules: {
      "prettier/prettier": "error",
      quotes: ["error", "double"],
      "object-curly-spacing": ["error", "always"],
    },
  },
];
