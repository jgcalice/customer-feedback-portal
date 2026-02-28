import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        black: "var(--abi-black)",
        white: "var(--abi-white)",
        gold: "var(--abi-gold)",
        "light-gold": "var(--abi-light-gold)",
        "dark-gold": "var(--abi-dark-gold)",
        "light-grey": "var(--abi-light-grey)",
        "dark-grey": "var(--abi-dark-grey)",
        red: "var(--abi-red)",
        blue: "var(--abi-blue)",
        beige: "var(--abi-beige)",
        green: "var(--abi-green)",
        "light-red": "var(--abi-light-red)",
        brown: "var(--abi-brown)",
      },
      borderRadius: {
        sm: "calc(var(--radius) * 0.5)",
        md: "var(--radius)",
        lg: "calc(var(--radius) * 2)",
        xl: "calc(var(--radius) * 3)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-serif)"],
      },
    },
  },
};

export default config;
