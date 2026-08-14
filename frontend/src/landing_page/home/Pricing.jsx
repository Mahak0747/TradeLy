import React from "react";
function Pricing() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-4">
          <h1 className="mb-3 fs-2">Simple and transparent</h1>
          <p>
            Explore the platform with straightforward pricing information and no unnecessary complexity.
          </p>
          <a href="" style={{ textDecoration: "none" }}>
            See Pricing{" "}
            <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
        <div className="col-2"></div>
        <div className="col-6  mb-5">
          <div className="row text-center">
            <div className="col p-3 border">
              <h1 className="mb-3">Free</h1>
              <p>
                Explore markets
                <br />
                Track your portfolio
              </p>
            </div>
            <div className="col p-3 border">
              <h1 className="mb-3">Demo</h1>
              <p>
                Simulated trading
                <br />
                Practice without real money
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;