/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slateDeep: {
          800: "#263B4C",
          900: "#061B2C",
        },
      },
      boxShadow: {
        header: "3px 4px 4px rgba(0,0,0,0.25)",
        card: "3px 5px 4px rgba(0,0,0,0.25)",
        pill: "7px 4px 19px 4px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
