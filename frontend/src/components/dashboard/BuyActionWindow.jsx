import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";


const BuyActionWindow = ({ stock }) => {
    const [stockQuantity, setStockQuantity] = useState(1);

    const [stockPrice, setStockPrice] = useState(stock?.price || 0);

    const generalContext = useContext(GeneralContext);

    const handleBuyClick = async () => {
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
                mode: "BUY",
            });

            alert("Stock Bought Successfully");

            generalContext.closeBuyWindow();

            window.location.reload();
        } 
        catch (err) {
            console.log("BUY ERROR", err.response?.data || err.message);
            alert(
                err.response?.data?.message ||err.response?.data?.error ||"Unable to Buy Stock"
            );
        }
    };

    return (
        <div className="order-window-overlay" onClick={generalContext.closeBuyWindow}>
            <div className="container" id="buy-window" onClick={(e) => e.stopPropagation()}>
                <div className="order-header">
                    <div className="order-header-title">
                        <span className="order-mode-badge buy-mode">Buy</span>
                        <h3> {stock?.name} </h3>
                    </div>
                    <button
                        type="button"
                        className="order-close-btn"
                        aria-label="Close"
                        onClick={generalContext.closeBuyWindow}
                    >
                        ✕
                    </button>
                </div>
                <div className="regular-order">
                    <div className="inputs">
                        <fieldset>
                            <legend> Qty. </legend>
                            <input type="number" value={stockQuantity} onChange={(e) =>setStockQuantity(e.target.value)}/>
                        </fieldset>
                        <fieldset>
                            <legend> Price </legend>
                            <input type="number" value={stockPrice} onChange={(e) =>setStockPrice(e.target.value)}/>
                        </fieldset>
                    </div>
                </div>
                <div className="buttons">
                    <span> Margin required ₹140.65 </span>
                    <div>
                        <Link className="btn btn-blue" onClick={handleBuyClick}>
                            Buy
                        </Link>
                        <Link className="btn btn-grey" onClick={generalContext.closeBuyWindow}> 
                            Cancel 
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyActionWindow;