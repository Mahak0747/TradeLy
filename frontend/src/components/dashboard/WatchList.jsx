import React, { useState, useEffect, useContext } from "react";
import api from "../../api";
import GeneralContext from "./GeneralContext";
import { Tooltip, Grow } from "@mui/material";
import { BarChartOutlined, KeyboardArrowDown, KeyboardArrowUp, MoreHoriz, SearchOutlined,} from "@mui/icons-material";
import { DoughnutChart } from "./DoughnoutChart";

const WatchList = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await api.get("/api/stocks/watchlist");
        console.log("LIVE STOCK DATA", response.data);
        setWatchlist(response.data);
      }
      catch (err) { console.log("Watchlist API error:", err.message); }
    };

    fetchWatchlist();

    const interval = setInterval(fetchWatchlist, 30000);
      return () => clearInterval(interval);
    }, []);

    const labels = watchlist.map(
      (stock) => stock.name
    );

    const data = {labels, datasets: [
        {
          label: "Price",
          data: watchlist.map((stock) => stock.price),
          backgroundColor: [
            "rgba(37, 99, 235, 0.85)",
            "rgba(96, 165, 250, 0.85)",
            "rgba(148, 163, 184, 0.85)",
            "rgba(30, 64, 175, 0.85)",
            "rgba(191, 219, 254, 0.85)",
            "rgba(100, 116, 139, 0.85)",
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };

    const filteredWatchlist = search.trim()
    ? watchlist.filter((stock) =>
        stock.name.toLowerCase().includes(search.toLowerCase())
      )
    : watchlist.slice(0, 6);

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
        <span className="counts">
          {watchlist.length} / 50
        </span>
      </div>
      <ul className="list">
        {filteredWatchlist.map((stock, index) => (
          <WatchListItem stock={stock} key={index} />
        ))}
      </ul>

      <div className="watchlist-chart">
        <p className="panel-label">Watchlist distribution</p>
        <DoughnutChart data={data} />
      </div>
    </div>
  );
};
export default WatchList;

const WatchListItem = ({ stock }) => {
  const [
    showWatchlistActions,
    setShowWatchlistActions
  ] = useState(false);
  const handleMouseEnter = () => { setShowWatchlistActions(true); };

  const handleMouseLeave = () => { setShowWatchlistActions(false); };

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>
          {stock.name}
        </p>
        <div className="itemInfo">
          <span className="percent">
            {stock.percent}
          </span>
          {
            stock.isDown ? <KeyboardArrowDown className="down" /> : <KeyboardArrowUp className="down" />
          }
          <span className="price">
            {stock.price}
          </span>
        </div>
      </div>
      {
        showWatchlistActions && <WatchListActions stock={stock} />
      }
    </li>
  );
};

const WatchListActions = ({ stock }) => {
  const generalContext = useContext(GeneralContext);

  const handleBuyClick = () => {
    generalContext.openBuyWindow(stock);
  };

  const handleSellClick = () => {
    generalContext.openSellWindow(stock);
  };

  return (
    <span className="actions">
      <span>
        <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
          <button className="buy" onClick={handleBuyClick}>
            Buy
          </button>
        </Tooltip>

        <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
          <button className="sell" onClick={handleSellClick}>
            Sell
          </button>
        </Tooltip>

        <Tooltip title="Analytics" placement="top" arrow TransitionComponent={Grow}>
          <button className="action">
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>

        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
          <button className="action">
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};