import React from "react";

function Brokerage() {
  return (
    <div className="container">
      <div className="row p-5 mt-5 text-center border-top">
          <a href="" style={{ textDecoration: "none" }}>
            <h3 className="fs-5">What's included</h3>
          </a>
          <ul
            style={{ textAlign: "center", lineHeight: "2.5", fontSize: "15px", listStyleType: "none",}}
            className="text-mut"
          >
            <li>Market Data: Live stock and index information fetched through the market-data API.</li>
            <li>Trading Dashboard: A centralized interface for monitoring your trading activity.</li>
            <li>Portfolio Management: View holdings, positions, and portfolio information.</li>
            <li>Order Management: Create and review demo orders directly from the platform.</li>
            <li>Watchlist: Keep track of stocks you're interested in.</li>
            <li>Funds Tracking: Monitor your available funds within the trading dashboard.</li>
          </ul>
        </div>
    </div>
  );
}

export default Brokerage;