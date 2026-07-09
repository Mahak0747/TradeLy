import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);

      localStorage.setItem("token", res.data.token);

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      alert("Login Successful");

      window.location.href = `http://localhost:5174?token=${res.data.token}`;
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Login Failed"
      );
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "60px auto",
        padding: "30px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        borderRadius: "10px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
          }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Don't have an account?{" "}
        <Link to="/signup">Signup</Link>
      </p>
    </div>
  );
};

export default Login;