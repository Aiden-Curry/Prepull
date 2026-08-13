import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { sans: ["var(--font-body)", "sans-serif"], display: ["var(--font-display)", "sans-serif"] } } }, plugins: [] };
export default config;
