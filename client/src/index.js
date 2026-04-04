import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Suppress harmless Leaflet "already initialized" errors in React 18 Strict Mode
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0]?.message?.includes("Map container is already initialized") ||
    (typeof args[0] === "string" &&
      args[0].includes("Map container is already initialized"))
  ) {
    return; // Suppress this specific error
  }
  originalError(...args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
