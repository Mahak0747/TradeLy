import React from "react";

function Universe() {
  return (
    <div className="container mt-5">
      <div className="row text-center">
        <h1>Everything connected in one place</h1>
        <p>
          TradeLy brings the essential parts of a trading workflow together so you can move from exploring the market to managing your portfolio without unnecessary complexity.
        </p>

        <div className="col-4 p-3 mt-5">
          <img src="media/images/smallcaseLogo.png" style={{ height: "50px" }} />
          <p className="text-small text-muted">Market Tracking</p>
        </div>
        <div className="col-4 p-3 mt-5">
          <img src="media/images/streakLogo.png" style={{ height: "50px" }} />
          <p className="text-small text-muted">Portfolio Management</p>
        </div>
        <div className="col-4 p-3 mt-5">
          <img src="media/images/sensibullLogo.svg" style={{ height: "50px" }} />
          <p className="text-small text-muted">Order Tracking</p>
        </div>
        <div className="col-4 p-3 mt-5">
          <img src="media/images/zerodhaFundhouse.png" style={{ height: "50px" }} />
          <p className="text-small text-muted">Positions</p>
        </div>
        <div className="col-4 p-3 mt-5">
          <img src="media/images/goldenpiLogo.png" style={{ height: "50px" }} />
          <p className="text-small text-muted">Funds</p>
        </div>
        <div className="col-4 p-3 mt-5">
          <img src="media/images/dittoLogo.png" style={{ height: "50px" }} />
          <p className="text-small text-muted">Watchlist</p>
        </div>
        <button
          className="p-2 btn btn-primary fs-5 mb-5 mt-4"
          style={{ width: "20%", margin: "0 auto" }}
        >
          Signup Now
        </button>
      </div>
    </div>
  );
}

export default Universe;