import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

const Funds = () => {
  const [funds, setFunds] = useState(null);

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      const res = await api.get("/funds");
      setFunds(res.data);
    } 
    catch (err) {
      console.log(err);
    }
  };

  if (!funds) return <h3 className="title">Loading...</h3>;

  return (
    <>
      <div className="funds">
        <p>Instant, zero-cost fund transfers with UPI</p>
        <Link className="btn btn-green"> Ad Withdraw </Link>
      </div>
      <div className="row">
        <div className="col">
          <span> <p>Equity</p> </span>
          <div className="table">
            <div className="data">
              <p>Available Margin</p>
              <p className="imp colored">
                ₹ {funds.availableMargin.toLocaleString( "en-IN" )}
              </p>
            </div>
            <div className="data">
              <p>Used Margin</p>
              <p className="imp">
                ₹{funds.usedMargin.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="data">
              <p>Available Cash</p>
              <p className="imp">
                ₹{funds.availableCash.toLocaleString("en-IN")}
              </p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>
                ₹ {funds.openingBalance.toLocaleString( "en-IN" )}
              </p>
            </div>
            <div className="data">
              <p>Payin</p>
              <p>
                 {funds.payin.toLocaleString( "en-IN" )}
              </p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="commodity">
            <p>You don't have a commodity account.</p>
            <Link className="btn btn-blue">
              Open Account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Funds;