/// <reference types="vite/client" />
// Supplies ambient module declarations for side-effect asset imports such as
// `import './styles/tokens.css'`. Without it, tsc reports TS2882 for every CSS
// import because tsconfig pins `types` to ["vitest/globals"], which stops
// vite/client from being picked up automatically.
