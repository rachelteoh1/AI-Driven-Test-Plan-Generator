import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserStatusProvider } from "./lib/UserStatusContext";
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <UserStatusProvider>
          <App />
        </UserStatusProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
