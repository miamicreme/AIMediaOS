import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0c10",
        panel: "#14161d",
        accent: "#7c5cff",
      },
    },
  },
  plugins: [],
};

export default config;
