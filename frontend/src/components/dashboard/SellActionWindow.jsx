import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const SellActionWindow = ({ stock }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(
    stock?.price || 0
  );
  const generalContext = useContext(GeneralContext);
  const handleSellClick = async () => {
    try {
      if (stockQuantity <= 0) {
    return alert("Quantity must be greater than 0");
}

if (stockPrice <= 0) {
    return alert("Price must be greater than 0");
}
      await api.post("/newOrder", {
        name: stock.name,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "SELL",
      });

      alert("Stock Sold Successfully");

      generalContext.closeSellWindow();

      window.location.reload();
    } 
    catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to Sell Stock"
      );
    }
  };

  return (
    <div className="order-window-overlay" onClick={generalContext.closeSellWindow}>
      <div className="container" id="buy-window" onClick={(e) => e.stopPropagation()}>
        <div className="order-header">
          <div className="order-header-title">
            <span className="order-mode-badge sell-mode">Sell</span>
            <h3>{stock?.name}</h3>
          </div>
          <button
            type="button"
            className="order-close-btn"
            aria-label="Close"
            onClick={generalContext.closeSellWindow}
          >
            ✕
          </button>
        </div>
        <div className="regular-order">
          <div className="inputs">
            <fieldset>
              <legend>Qty.</legend>
              <input type="number" value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(e.target.value)
                }
              />
            </fieldset>
            <fieldset>
              <legend>Price</legend>
              <input type="number" value={stockPrice}
                onChange={(e) =>
                  setStockPrice(e.target.value)
                }
              />
            </fieldset>
          </div>
        </div>
        <div className="buttons">
          <span>Amount ₹{stockQuantity * stockPrice}</span>
          <div>
            <Link className="btn btn-blue" onClick={handleSellClick}>
              Sell
            </Link>
            <Link className="btn btn-grey" onClick={generalContext.closeSellWindow}>
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;