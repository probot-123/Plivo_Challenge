/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background-rgb))",
        foreground: "rgb(var(--foreground-rgb))",
        primary: "rgb(var(--primary-color))",
        success: "rgb(var(--success-color))",
        warning: "rgb(var(--warning-color))",
        danger: "rgb(var(--danger-color))",
        info: "rgb(var(--info-color))",
      },
    },
  },
  plugins: [],
}; 