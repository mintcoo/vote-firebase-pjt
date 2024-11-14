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
      animation: {
        ring: "ring 3.5s ease-in-out infinite",
        jump: "jump 1s ease-in-out infinite",
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(-8%)",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "translateY(0)",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
        jump: {
          "0%, 100%": {
            transform: "translateY(-100%)",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "translateY(0)",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
        ring: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "15%": {
            transform: "rotate(20deg)",
          },
          "30%": {
            transform: "rotate(-20deg)",
          },
          "40%": {
            transform: "rotate(10deg)",
          },
          "50%": {
            transform: "rotate(-10deg)",
          },
          "60%": {
            transform: "rotate(5deg)",
          },
          "70%": {
            transform: "rotate(-5deg)",
          },
          "80%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(0deg)",
          },
        },
      },
    },
  },
  plugins: [],
};
