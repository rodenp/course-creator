/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // If using pages router
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/course-plugin/src/**/*.{js,ts,jsx,tsx,mdx}", // Path to plugin
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
