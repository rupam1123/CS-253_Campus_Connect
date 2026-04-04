import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App.jsx";
import { fetchJson } from "./lib/api.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
 <React.StrictMode>
  <SWRConfig
   value={{
    fetcher: fetchJson,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
   }}
  >
   <App />
  </SWRConfig>
 </React.StrictMode>,
);
