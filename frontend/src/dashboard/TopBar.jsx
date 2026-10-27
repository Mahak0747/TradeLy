import React from "react";
import Menu from "./Menu";
import useApiData from "../hooks/useApiData";
import { money } from "../utils/format";

const pct = (p) => (p == null ? "--" : `${p >= 0 ? "+" : ""}${Number(p).toFixed(2)}%`);

const Index = ({ cls, label, quote }) => (
  <div className={cls}>
    <p className="index">{label}</p>
    <p className="index-points">{money(quote?.price)}</p>
    <p className={quote?.percent == null ? "" : quote.percent >= 0 ? "up" : "down"}>{pct(quote?.percent)}</p>
  </div>
);

const TopBar = () => {
  const { data, error, stale } = useApiData("/marketIndices", { interval: 15000 });
  return (
    <div className="topbar-container">
      <div
        className="indices-container"
        title={error && !data ? "Market data unavailable right now" : stale ? "Showing last known values" : undefined}
      >
        <Index cls="nifty" label="NIFTY 50" quote={data?.nifty} />
        <Index cls="sensex" label="SENSEX" quote={data?.sensex} />
      </div>
      <Menu />
    </div>
  );
};

export default TopBar;
