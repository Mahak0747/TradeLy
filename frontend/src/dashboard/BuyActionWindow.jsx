import React from "react";
import OrderWindow from "./OrderWindow";

const BuyActionWindow = ({ stock }) => <OrderWindow stock={stock} mode="BUY" />;

export default BuyActionWindow;
