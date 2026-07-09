import React, { useState } from "react";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: () => {},
  closeBuyWindow: () => {},
  openSellWindow: () => {},
  closeSellWindow: () => {},
});

export const GeneralContextProvider = ({ children }) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);

  const openBuyWindow = (stock) => {
    setSelectedStock(stock);
    setIsBuyWindowOpen(true);
  };

  const closeBuyWindow = () => {
    setSelectedStock(null);
    setIsBuyWindowOpen(false);
  };

  const openSellWindow = (stock) => {
    setSelectedStock(stock);
    setIsSellWindowOpen(true);
  };

  const closeSellWindow = () => {
    setSelectedStock(null);
    setIsSellWindowOpen(false);
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow,
        closeBuyWindow,
        openSellWindow,
        closeSellWindow,
      }}
    >
      {children}

      {isBuyWindowOpen && (
        <BuyActionWindow stock={selectedStock} />
      )}

      {isSellWindowOpen && (
        <SellActionWindow stock={selectedStock} />
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;