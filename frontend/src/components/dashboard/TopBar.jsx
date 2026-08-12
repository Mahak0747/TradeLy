import React, { useEffect, useState } from "react";
import api from "../../api";
import Menu from "./Menu";

const TopBar = () => {
  const [indices, setIndices] = useState({
    nifty: {},
    sensex: {},
  });

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await api.get("/marketIndices");
        setIndices(res.data);
      } catch (err) {
        console.error("Failed to fetch market indices:", err);
      }
    };

    fetchIndices();

    const interval = setInterval(fetchIndices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">
            {indices.nifty.price != null
              ? indices.nifty.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "--"}
          </p>
          <p className="loss">
            {indices.nifty.percent != null
              ? `${indices.nifty.percent >= 0 ? "+" : ""}${indices.nifty.percent.toFixed(2)}%`
              : "--"}
          </p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">
            {indices.sensex.price != null
              ? indices.sensex.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "--"}
          </p>
          <p className="loss">
            {indices.sensex.percent != null
              ? `${indices.sensex.percent >= 0 ? "+" : ""}${indices.sensex.percent.toFixed(2)}%`
              : "--"}
          </p>
        </div>
      </div>
      <Menu />
    </div>
  );
};

export default TopBar;