/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      width: {
        "1/20": "5%",
        "5vw": "5vw",
        "10vw": "10vw",
        "20vw": "20vw",
        "30vw": "30vw",
      },
      height: {
        "1/10": "10%",
        "5vh": "5vh",
        "10vh": "10vh",
        "20vh": "20vh",
        "25vh": "25vh",
        "30vh": "30vh",
        "35vh": "35vh",
        "50vh": "50vh",
      },
      fontSize: {
        "1vw": "1vw",
        "1.1vw": "1.1vw",
        "1.2vw": "1.2vw",
        "1.5vw": "1.5vw",
        "2vw": "2vw",
        "2.5vw": "2.5vw",
        "3vw": "3vw",
        "30vw": "30vw",
      },
    },
  },
  plugins: [],
};
