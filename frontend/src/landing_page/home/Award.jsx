import React from "react";
function Awards() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-6 p-5">
          <img src="media/images/largestBroker.svg" />
        </div>
        <div className="col-6 p-5 mt-5">
          <h1>Everything you need to explore the market</h1>
          <p className="mb-5">
            Track market movements, explore opportunities, and manage your investments from one place
          </p>
          <div className="row">
            <div className="col-6">
              <ul>
                <li>
                  <p>Stocks & ETFs</p>
                </li>           
                <li>
                  <p>Market Indices</p>
                </li>
                <li>
                  <p>Intraday Trading</p>
                </li>
              </ul>
            </div>
            <div className="col-6">
              <ul>
                <li>
                  <p>Portfolio Tracking</p>
                </li>
                <li>
                  <p>Market Insights</p>
                </li>
                <li>
                  <p>Order Management</p>
                </li>
              </ul>
            </div>
          </div>
          <img src="media/images/pressLogos.png" style={{ width: "90%" }} />
        </div>
      </div>
    </div>
  );
}

export default Awards;