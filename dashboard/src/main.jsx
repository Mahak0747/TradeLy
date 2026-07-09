import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import AuthLoader from "./AuthLoader";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthLoader>
        <Routes>
          <Route path="/*" element={<Home />} />
        </Routes>
      </AuthLoader>
    </BrowserRouter>
  </React.StrictMode>
);
