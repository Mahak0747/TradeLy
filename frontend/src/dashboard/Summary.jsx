import React, { useMemo } from "react";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice, StaleNote } from "../components/Status";
import { money, safeJson, toNum } from "../utils/format";

const EMPTY = [];

const Summary = () => {
  // Two independent requests, fired in parallel; one failing no longer blanks the other
  const fundsQ = useApiData("/funds");
  const holdingsQ = useApiData("/allHoldings", { interval: 30000 });
  const funds = fundsQ.data;
  const holdings = Array.isArray(holdingsQ.data) ? holdingsQ.data : EMPTY;
  const username = safeJson("user")?.username || "User";

  const { investment, currentValue, pnl, pnlPercent } = useMemo(() => {
    const investment = holdings.reduce((s, h) => s + toNum(h.avg) * toNum(h.qty), 0);
    const currentValue = holdings.reduce((s, h) => s + toNum(h.price) * toNum(h.qty), 0);
    const pnl = currentValue - investment;
    return { investment, currentValue, pnl, pnlPercent: investment > 0 ? ((pnl / investment) * 100).toFixed(2) : "0.00" };
  }, [holdings]);

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
        {fundsQ.error && !funds ? (
          <ErrorNotice message={`Could not load funds: ${fundsQ.error}`} onRetry={fundsQ.refresh} />
        ) : (
          <div className="data">
            <div className="first">
              <h3>₹{funds ? money(funds.availableMargin) : "…"}</h3>
              <p>Margin available</p>
            </div>
            <hr />
            <div className="second">
              <p>
                Margins used <span>₹{funds ? money(funds.usedMargin) : "0"}</span>
              </p>
              <p>
                Opening balance <span>₹{funds ? money(funds.openingBalance) : "0"}</span>
              </p>
            </div>
          </div>
        )}
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({holdings.length})</p>
        </span>
        <StaleNote show={holdingsQ.stale} />
        {holdingsQ.loading && !holdingsQ.data ? (
          <Loading label="Loading holdings…" />
        ) : holdingsQ.error && !holdingsQ.data ? (
          <ErrorNotice message={`Could not load holdings: ${holdingsQ.error}`} onRetry={holdingsQ.refresh} />
        ) : (
          <div className="data">
            <div className="first">
              <h3 className={pnl >= 0 ? "profit" : "loss"}>
                ₹{money(pnl)}{" "}
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
                Current Value <span>₹{money(currentValue)}</span>
              </p>
              <p>
                Investment <span>₹{money(investment)}</span>
              </p>
            </div>
          </div>
        )}
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;
