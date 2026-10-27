import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: () => {},
  closeBuyWindow: () => {},
  openSellWindow: () => {},
  closeSellWindow: () => {},
  orderPlaced: () => {},
  refreshKey: 0,
});

export const GeneralContextProvider = ({ children }) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bumped after every order -> data hooks re-fetch (no page reload)
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const openBuyWindow = useCallback((stock) => {
    setSelectedStock(stock);
    setIsBuyWindowOpen(true);
  }, []);
  const closeBuyWindow = useCallback(() => {
    setSelectedStock(null);
    setIsBuyWindowOpen(false);
  }, []);
  const openSellWindow = useCallback((stock) => {
    setSelectedStock(stock);
    setIsSellWindowOpen(true);
  }, []);
  const closeSellWindow = useCallback(() => {
    setSelectedStock(null);
    setIsSellWindowOpen(false);
  }, []);

  const orderPlaced = useCallback((message) => {
    setRefreshKey((k) => k + 1);
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Stable value: consumers only re-render when something they use actually changes
  const value = useMemo(
    () => ({ openBuyWindow, closeBuyWindow, openSellWindow, closeSellWindow, orderPlaced, refreshKey }),
    [openBuyWindow, closeBuyWindow, openSellWindow, closeSellWindow, orderPlaced, refreshKey]
  );

  return (
    <GeneralContext.Provider value={value}>
      {children}
      {isBuyWindowOpen && <BuyActionWindow stock={selectedStock} />}
      {isSellWindowOpen && <SellActionWindow stock={selectedStock} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
