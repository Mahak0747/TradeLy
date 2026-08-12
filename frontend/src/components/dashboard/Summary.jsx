import React, { useEffect, useState } from "react";
import api from "../../api";

const Summary = () => {
  const [funds, setFunds] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setUsername(user.username);
    const fetchData = async () => {
      try {
        const [fundRes, holdingRes] = await Promise.all([
          api.get("/funds"),
          api.get("/allHoldings"),
        ]);
        setFunds(fundRes.data);
        setHoldings(holdingRes.data);
      } 
      catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  const investment = holdings.reduce(
    (sum, stock) => sum + stock.avg * stock.qty,0
  );

  const currentValue = holdings.reduce(
    (sum, stock) => sum + stock.price * stock.qty,0
  );

  const pnl = currentValue - investment;

  const pnlPercent =
    investment > 0 ? ((pnl / investment) * 100).toFixed(2) : "0.00";

  return (
    <>
      <div className="username">
        <h6>Hi, {username}!</h6>
        <hr className="divider" />
      </div>
      <div className="section">
        <span>
          <p>Equity</p>
        </span>
        <div className="data">
          <div className="first">
            <h3>
              ₹
              {funds
                ? funds.availableMargin.toLocaleString("en-IN")
                : "Loading..."}
            </h3>
            <p>Margin available</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Margins used{" "}
              <span>
                ₹
                {funds
                  ? funds.usedMargin.toLocaleString("en-IN")
                  : "0"}
              </span>
            </p>
            <p>
              Opening balance{" "}
              <span>
                ₹
                {funds
                  ? funds.openingBalance.toLocaleString("en-IN")
                  : "0"}
              </span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
      <div className="section">
        <span>
          <p>Holdings ({holdings.length})</p>
        </span>
        <div className="data">
          <div className="first">
            <h3 className={pnl >= 0 ? "profit" : "loss"}>
              ₹{pnl.toFixed(2)}{" "}
              <small>
                {pnl >= 0 ? "+" : ""}
                {pnlPercent}%
              </small>
            </h3>
            <p>P&L</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Current Value{" "}
              <span>₹{currentValue.toFixed(2)}</span>
            </p>
            <p>
              Investment{" "}
              <span>₹{investment.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;