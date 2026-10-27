import React from "react";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice, StaleNote } from "../components/Status";
import { money, toNum } from "../utils/format";

const Positions = () => {
  const { data, error, loading, stale, refresh } = useApiData("/allPositions", { interval: 30000 });
  const allPositions = Array.isArray(data) ? data : [];

  return (
    <>
      <h3 className="title">Positions ({allPositions.length})</h3>
      <StaleNote show={stale} />
      {loading && !data && <Loading label="Loading positions…" />}
      {error && !data && <ErrorNotice message={`Could not load positions: ${error}`} onRetry={refresh} />}
      {data && (
        <div className="order-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Instrument</th>
                <th>Qty.</th>
                <th>Avg.</th>
                <th>LTP</th>
                <th>P&L</th>
                <th>Chg.</th>
              </tr>
            </thead>
            <tbody>
              {allPositions.length === 0 && (
                <tr>
                  <td colSpan={7}>No open positions.</td>
                </tr>
              )}
              {allPositions.map((s) => {
                const pnl = (toNum(s.price) - toNum(s.avg)) * toNum(s.qty);
                return (
                  <tr key={s._id || s.name}>
                    <td>{s.product}</td>
                    <td>{s.name}</td>
                    <td>{s.qty}</td>
                    <td>{money(s.avg)}</td>
                    <td>{money(s.price)}</td>
                    <td className={pnl >= 0 ? "profit" : "loss"}>{money(pnl)}</td>
                    <td className={s.isLoss ? "loss" : "profit"}>{s.day}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default Positions;
