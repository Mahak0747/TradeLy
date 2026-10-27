import React, { useContext, useState } from "react";
import api, { errorMessage } from "../api";
import GeneralContext from "./GeneralContext";
import { money, toNum } from "../utils/format";
import "./BuyActionWindow.css";

/**
 * Shared implementation of the Buy and Sell windows (they were two near-identical copies).
 * The order executes at the server's live price; the price shown here is the latest watchlist price.
 */
const OrderWindow = ({ stock, mode }) => {
  const isBuy = mode === "BUY";
  const ctx = useContext(GeneralContext);
  const close = isBuy ? ctx.closeBuyWindow : ctx.closeSellWindow;
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const price = toNum(stock?.price);
  const quantity = Math.floor(toNum(qty));
  const valid = Number.isInteger(Number(qty)) && quantity >= 1;

  const submit = async () => {
    if (submitting) return;
    if (!valid) return setError("Quantity must be a whole number greater than 0");
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/newOrder", { name: stock.name, qty: quantity, mode });
      const p = res.data?.order?.price;
      close();
      ctx.orderPlaced(`${isBuy ? "Bought" : "Sold"} ${quantity} ${stock.name}${p ? ` @ ₹${money(p)}` : ""}`);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="order-window-overlay" onClick={close}>
      <div className="container" id="buy-window" onClick={(e) => e.stopPropagation()}>
        <div className="order-header">
          <div className="order-header-title">
            <span className={`order-mode-badge ${isBuy ? "buy-mode" : "sell-mode"}`}>{isBuy ? "Buy" : "Sell"}</span>
            <h3>{stock?.name}</h3>
          </div>
          <button type="button" className="order-close-btn" aria-label="Close" onClick={close}>
            ✕
          </button>
        </div>
        <div className="regular-order">
          <div className="inputs">
            <fieldset>
              <legend>Qty.</legend>
              <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
            </fieldset>
            <fieldset>
              <legend>Price</legend>
              <input type="text" value={money(price)} readOnly title="Orders execute at the live market price" />
            </fieldset>
          </div>
        </div>
        <div className="buttons">
          <span>
            {isBuy ? "Margin required" : "Amount"} ₹{money(valid ? quantity * price : 0)}
          </span>
          <div>
            <button type="button" className="btn btn-blue" onClick={submit} disabled={submitting || !valid}>
              {submitting ? "Placing…" : isBuy ? "Buy" : "Sell"}
            </button>
            <button type="button" className="btn btn-grey" onClick={close} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
        <p className="order-note" style={{ margin: "8px 16px 12px", fontSize: "0.72rem", color: "var(--db-text-muted)" }}>
          Executes at the live market price.
        </p>
        {error && (
          <p className="form-error" role="alert" style={{ margin: "0 16px 12px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderWindow;
