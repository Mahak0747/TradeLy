import React from "react";

function Hero() {
  return (
    <div className="container">
      <div className="row p-5 mt-5 mb-5">
        <h1 className="fs-2 text-center">
          A smarter way to explore the market.
        </h1>
      </div>

      <div
        className="row p-5 mt-5 border-top text-muted"
        style={{ lineHeight: "1.8", fontSize: "1.2em" }}
      >
        <div className="col-6 p-5">
          <p>
            TradeLy is a personal stock-market platform built to bring market tracking, portfolio management, and trading functionality together in one simple interface.
          </p>
          <p>
            The idea behind TradeLy was to create a platform that feels practical and easy to navigate while giving users a clear view of their market activity.
          </p>
          <p>
            From live market prices and index movements to holdings, positions, orders, and funds, the platform brings essential trading information together in one place.
          </p>
        </div>
        <div className="col-6 p-5">
          <p>
            TradeLy is built as a personal project to explore how modern trading platforms work and to create a complete full-stack experience around real-time financial data.
          </p>
          <p>
            The project combines a responsive frontend, backend APIs, database integration, and live market data to create a realistic trading-platform experience.
          </p>
          <p>
            Rather than focusing only on the interface, TradeLy was developed with the complete trading workflow in mind — from fetching market data to displaying portfolios and processing orders.          
          </p>          
        </div>
      </div>
    </div>
  );
}

export default Hero;