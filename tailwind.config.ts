import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ea580c',
        'primary-hover': '#c2410c',
        ink: '#1a1a1a',
        muted: '#65676b',
        border: '#e5e5e5',
        'border-strong': '#d1d5db',
        section: '#f0f2f5',
        surface: '#fafafa',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        scan: "0 8px 24px rgba(0,0,0,0.25)",
        card: "0 2px 6px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
