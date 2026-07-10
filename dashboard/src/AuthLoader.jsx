import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const AuthLoader = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", location.pathname);
    }
  }, [location]);

  return children;
  
};

export default AuthLoader;