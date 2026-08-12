import React from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import "./dashboard.css";

const Home = () => {
  return (
    <div className="dashboard-scope">
      <TopBar />
      <Dashboard />
    </div>
  );
};

export default Home;
