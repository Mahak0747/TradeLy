import React from "react";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice } from "../components/Status";
import { money } from "../utils/format";

const Funds = () => {
  const { data: funds, error, loading, refresh } = useApiData("/funds");

  if (loading && !funds) return <Loading label="Loading funds…" />;
  if (!funds) return <ErrorNotice message={`Could not load funds: ${error || "unknown error"}`} onRetry={refresh} />;

  return (
    <>
      <div className="funds">
        <p>Instant, zero-cost fund transfers with UPI</p>
        {/* placeholder actions (not implemented in this project) - real buttons instead of <Link> without a target */}
        <button type="button" className="btn btn-green">
          Add / Withdraw
        </button>
      </div>
      <div className="row">
        <div className="col">
          <span>
            <p>Equity</p>
          </span>
          <div className="table">
            <div className="data">
              <p>Available Margin</p>
              <p className="imp colored">₹ {money(funds.availableMargin)}</p>
            </div>
            <div className="data">
              <p>Used Margin</p>
              <p className="imp">₹{money(funds.usedMargin)}</p>
            </div>
            <div className="data">
              <p>Available Cash</p>
              <p className="imp">₹{money(funds.availableCash)}</p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>₹ {money(funds.openingBalance)}</p>
            </div>
            <div className="data">
              <p>Payin</p>
              <p>{money(funds.payin)}</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="commodity">
            <p>You don't have a commodity account.</p>
            <button type="button" className="btn btn-blue">
              Open Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Funds;
