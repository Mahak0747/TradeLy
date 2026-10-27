import React from "react";
import OrderWindow from "./OrderWindow";

const SellActionWindow = ({ stock }) => <OrderWindow stock={stock} mode="SELL" />;

export default SellActionWindow;
