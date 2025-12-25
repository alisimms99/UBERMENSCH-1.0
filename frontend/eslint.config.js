import js from "@eslint/js"
import globals from "globals"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"

export default defineConfig([
  // Ignore build output
  { ignores: ["dist/**"] },

  // Lint only application source files
  {
    files: ["src/**/*.{js,jsx,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["src/**/*.{js,jsx,mjs,cjs}"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // Enable the plugin so inline disables like
      // `// eslint-disable-next-line react-hooks/exhaustive-deps`
      // do not error, but keep the codebase’s previous lint strictness.
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      // React 17+ JSX transform
      "react/react-in-jsx-scope": "off",
      // This codebase doesn’t use PropTypes
      "react/prop-types": "off",
      // This repo has lots of legacy unused vars; keep lint usable
      "no-unused-vars": "off",
    },
    plugins: {
      "react-hooks": pluginReactHooks,
    },
  },
])
