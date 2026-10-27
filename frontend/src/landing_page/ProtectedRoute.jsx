import React from "react";
import { Navigate } from "react-router-dom";
import { clearSession } from "../api";

/** Reads `exp` from the JWT payload (no verification - the server does that). */
function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true; // not a decodable JWT
  }
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token || isExpired(token)) {
    clearSession();
    return <Navigate to={token ? "/login?expired=1" : "/login"} replace />;
  }
  return children;
};

export default ProtectedRoute;
