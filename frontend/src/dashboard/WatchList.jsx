import React, { memo, useContext, useMemo, useState } from "react";
import GeneralContext from "./GeneralContext";
import Tooltip from "@mui/material/Tooltip";
import Grow from "@mui/material/Grow";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { DoughnutChart } from "./DoughnoutChart";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice, StaleNote } from "../components/Status";

const COLORS = [
  "rgba(37, 99, 235, 0.85)",
  "rgba(96, 165, 250, 0.85)",
  "rgba(148, 163, 184, 0.85)",
  "rgba(30, 64, 175, 0.85)",
  "rgba(191, 219, 254, 0.85)",
  "rgba(100, 116, 139, 0.85)",
];
const EMPTY = [];

const WatchList = () => {
  const { data, error, loading, stale, refresh } = useApiData("/api/stocks/watchlist", { interval: 30000 });
  const [search, setSearch] = useState("");
  const watchlist = Array.isArray(data) ? data : EMPTY;

  const chartData = useMemo(
    () => ({
      labels: watchlist.map((s) => s.name),
      datasets: [{ label: "Price", data: watchlist.map((s) => s.price), backgroundColor: COLORS, borderColor: "#ffffff", borderWidth: 2 }],
    }),
    [watchlist]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? watchlist.filter((s) => s.name.toLowerCase().includes(q)) : watchlist.slice(0, 6);
  }, [watchlist, search]);

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search stocks..."
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="counts">{watchlist.length} / 50</span>
      </div>

      <StaleNote show={stale} />
      {loading && watchlist.length === 0 && <Loading label="Loading market data…" />}
      {error && watchlist.length === 0 && !loading && <ErrorNotice message={error} onRetry={refresh} />}

      <ul className="list">
        {visible.map((stock) => (
          <WatchListItem stock={stock} key={stock.name} />
        ))}
      </ul>
      {search.trim() && visible.length === 0 && watchlist.length > 0 && <div className="status-block">No stocks match “{search.trim()}”.</div>}

      {watchlist.length > 0 && (
        <div className="watchlist-chart">
          <p className="panel-label">Watchlist distribution</p>
          <DoughnutChart data={chartData} />
        </div>
      )}
    </div>
  );
};
export default WatchList;

const WatchListItem = memo(function WatchListItem({ stock }) {
  const [showActions, setShowActions] = useState(false);
  return (
    <li onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.percent}</span>
          {stock.isDown ? <KeyboardArrowDown className="down" /> : <KeyboardArrowUp className="up" />}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showActions && <WatchListActions stock={stock} />}
    </li>
  );
});

const WatchListActions = ({ stock }) => {
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const slots = { transition: Grow }; // MUI 9: `TransitionComponent` no longer exists

  return (
    <span className="actions">
      <span>
        <Tooltip title="Buy (B)" placement="top" arrow slots={slots}>
          <button className="buy" onClick={() => openBuyWindow(stock)}>
            Buy
          </button>
        </Tooltip>
        <Tooltip title="Sell (S)" placement="top" arrow slots={slots}>
          <button className="sell" onClick={() => openSellWindow(stock)}>
            Sell
          </button>
        </Tooltip>
        <Tooltip title="Analytics" placement="top" arrow slots={slots}>
          <button className="action">
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="More" placement="top" arrow slots={slots}>
          <button className="action">
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};
