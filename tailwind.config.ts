import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f9fafb",
        foreground: "#111827",
        input: "#ffffff",
        primary: "#3f2d90",
        "primary-foreground": "#ffffff",
        ring: "#6366f1",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        muted: "#f3f4f6",
        "muted-foreground": "#6b7280",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
};

export default config;