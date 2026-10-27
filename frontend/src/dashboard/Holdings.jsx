import React, { useMemo } from "react";
import { VerticalGraph } from "./VerticalGraph";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice, StaleNote } from "../components/Status";
import { money, toNum } from "../utils/format";

const EMPTY = [];

const Holdings = () => {
  const { data, error, loading, stale, refresh } = useApiData("/allHoldings", { interval: 30000 });
  const allHoldings = Array.isArray(data) ? data : EMPTY;

  const chartData = useMemo(
    () => ({
      labels: allHoldings.map((s) => s.name),
      datasets: [{ label: "Stock Price", data: allHoldings.map((s) => toNum(s.price)), backgroundColor: "rgba(37, 99, 235, 0.75)" }],
    }),
    [allHoldings]
  );

  const totals = useMemo(() => {
    const totalInvestment = allHoldings.reduce((t, s) => t + toNum(s.avg) * toNum(s.qty), 0);
    const currentValue = allHoldings.reduce((t, s) => t + toNum(s.price) * toNum(s.qty), 0);
    const totalProfit = currentValue - totalInvestment;
    return { totalInvestment, currentValue, totalProfit, profitPercent: totalInvestment ? ((totalProfit / totalInvestment) * 100).toFixed(2) : "0.00" };
  }, [allHoldings]);

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>
      <StaleNote show={stale} />
      {loading && !data && <Loading label="Loading holdings…" />}
      {error && !data && <ErrorNotice message={`Could not load holdings: ${error}`} onRetry={refresh} />}

      {data && (
        <>
          <div className="order-table">
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Qty.</th>
                  <th>Avg. cost</th>
                  <th>LTP</th>
                  <th>Cur. val</th>
                  <th>P&L</th>
                  <th>Net chg.</th>
                  <th>Day chg.</th>
                </tr>
              </thead>
              <tbody>
                {allHoldings.length === 0 && (
                  <tr>
                    <td colSpan={8}>No holdings yet. Buy a stock from the watchlist to get started.</td>
                  </tr>
                )}
                {allHoldings.map((s) => (
                  <tr key={s._id || s.name}>
                    <td>{s.name}</td>
                    <td>{s.qty}</td>
                    <td>{money(s.avg)}</td>
                    <td title={s.priceSource === "stored" ? "Live price unavailable - showing the last saved price" : undefined}>
                      {money(s.price)}
                      {s.priceSource === "stored" ? "*" : ""}
                    </td>
                    <td>{money(s.curValue)}</td>
                    <td className={toNum(s.profit) >= 0 ? "profit" : "loss"}>{money(s.profit)}</td>
                    <td className={toNum(s.profit) >= 0 ? "profit" : "loss"}>{s.net}</td>
                    <td className={String(s.day).startsWith("-") ? "loss" : "profit"}>{s.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row">
            <div className="col">
              <h5>{money(totals.totalInvestment)}</h5>
              <p>Total investment</p>
            </div>
            <div className="col">
              <h5>{money(totals.currentValue)}</h5>
              <p>Current value</p>
            </div>
            <div className="col">
              <h5>
                {money(totals.totalProfit)} ( {totals.profitPercent}% )
              </h5>
              <p>P&L</p>
            </div>
          </div>
          {allHoldings.length > 0 && (
            <div className="chart-panel">
              <VerticalGraph data={chartData} />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Holdings;
