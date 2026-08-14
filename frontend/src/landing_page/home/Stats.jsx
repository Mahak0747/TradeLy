import React from "react";

function Stats() {
  return (
    <div className="container p-3">
      <div className="row p-5">
        <div className="col-6 p-5">
          <h1 className="fs-2 mb-5">Built for a better trading experience</h1>
          <h2 className="fs-4">Simple by design</h2>
          <p className="text-muted">
            A clean interface that keeps your portfolio, orders, holdings, and market data easy to understand.
          </p>
          <h2 className="fs-4">Real-time market data</h2>
          <p className="text-muted">
            Stay updated with live market prices and index movements while you explore the market.
          </p>
          <h2 className="fs-4">Your portfolio, one place</h2>
          <p className="text-muted">
            Monitor your holdings, positions, orders, and available funds from a single dashboard.
          </p>
          <h2 className="fs-4">Trade with clarity</h2>
          <p className="text-muted">
            Designed to help you understand your portfolio and make decisions without unnecessary complexity.
          </p>
        </div>
        <div className="col-6 p-5">
          <img src="media/images/ecosystem.png" style={{ width: "90%" }} />
          <div className="text-center">
            <a href="" className="mx-5" style={{ textDecoration: "none" }}>
              Explore our products{" "}
              <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;